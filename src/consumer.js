import minimist from 'minimist';
import {Base} from './base.js';
import Amazon from './amazon';
import Sparkpost from './sparkpost';
import Mailgun from './mailgun';
import Sendinblue from './sendinblue';
import config from './config.json';

let vendors = [Amazon, Mailgun, Sendinblue, Sparkpost];

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
	async sendMailAndSave(mongo_id, mail, jobid) {
		let vendor;
		try {
			vendor = selectAvailableVendor(jobid);

			await vendor.send_if_production(mail);
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
				this.sendMailAndSave(mongo_id, mail, jobid);
				console.error(e);
			}
		}
	}
	run() {
		this.beanstalkd.reserve().then((job) => {
			this.process(job);
			setTimeout(this.run.bind(this), 0);
		})
		.catch((e) => {
			console.trace(e);
			setTimeout(this.run.bind(this), 0);
		});
	}
	async recieve() {
        // Only for testing
		let job = await this.beanstalkd.reserve();
		return await this.process(job);
	}
	async process(job) {
		let mongo_id = job.payload.mongo_id;
		let mail = await this.mongodb.get(mongo_id);

		await this.sendMailAndSave(mongo_id, mail, job.jobid);
		this.throughput_count++;
		await this.beanstalkd.delete(job.jobid);
		return job;
	}
}

export async function run_consumer(options) {
	let consumer = new Consumer(options);

	await consumer.connect();
	process.on('SIGINT', async () => {
		await consumer.close();
		console.log(`Consumer with PID: ${process.pid} exiting`);
		process.exit(0);
	});

	consumer.run();
}

if (require.main === module) {
	try {
		let args = minimist(process.argv.slice(2));
		let options;
		if ('test' in args && args.test === true) {
			options = {mongo_config: config.test.mongodb, beanstalkd_config: config.test.beanstalkd};
		} else {
			options = {mongo_config: config.mongodb, beanstalkd_config: config.beanstalkd};
		}
		run_consumer(options);
	} catch (e) {
		console.trace(e);
		throw e;
	}
}
