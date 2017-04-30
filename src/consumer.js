import {Base} from './base.js';
import Amazon from './amazon';
import Sparkpost from './sparkpost';
import config from './config.json';

let vendors = [Amazon, Sparkpost];

class NoServiceAvailable extends Error {
	constructor(...args) {
		super(...args);
		Error.captureStackTrace(this, NoServiceAvailable);
	}
}

function selectAvailableVendor(jobid) {
	let availableVendors = vendors.filter(vendor => vendor.available);
	if (availableVendors.length === 0) {
		throw new NoServiceAvailable();
	}

	const radix = 10;
	let vendor = vendors[parseInt(jobid, radix) % availableVendors.length];
	return vendor;
}

export class Consumer extends Base {
	async connect() {
		await this.beanstalkd.connect();
		await this.beanstalkd.watch(this.tube);

		await this.mongodb.connect();
	}
	async sendMailAndSave(mongo_id, item, jobid) {
		let vendor;
		try {
			vendor = selectAvailableVendor(jobid);

			await vendor.send_if_production(item);
			await this.mongodb.save_attempt({
				id: mongo_id,
				vendor: vendor.constructor.name,
				timestamp: new Date()
			});
		} catch (e) {
			if (e instanceof NoServiceAvailable) {
				throw e;
			} else {
				vendor.disableTemporarily();
				this.sendMailAndSave(mongo_id, item, jobid);
				console.error(e);
			}
		}
	}
	async recieve() {
		let job = await this.beanstalkd.reserve();
		let mongo_id = job.payload.mongo_id;
		let item = await this.mongodb.get(mongo_id);

		await this.sendMailAndSave(mongo_id, item, job.jobid);
		this.throughput_count++;
		await this.beanstalkd.delete(job.jobid);
		return job;
	}
}

export async function run_consumer() {
	let consumer = new Consumer(config.beanstalkd);

	await consumer.connect();
	process.on('SIGINT', () => {
		consumer.close();
		console.log(`Consumer with PID: ${process.pid} exited`);
	});

	let job = await consumer.recieve();
	while (job) {
		try {
			job = await consumer.recieve();
		} catch (e) {
			console.error(e);
			break;
		}
	}
}

if (require.main === module) {
	run_consumer();
}
