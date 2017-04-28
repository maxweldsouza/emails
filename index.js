import FiveBeans from './fivebeans_wrapper';
import MongoDB from './mongo';
import * as config from './config.json';
import Amazon from './amazon';
import Sparkpost from './sparkpost';

const DEFAULT_PRIORITY = 5;
const RETRY_PRIORITY = 4;
const ZERO_DELAY = 0;

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

class Base {
	constructor() {
		this.beanstalkd = new FiveBeans();
		this.mongodb = new MongoDB({
			url: config.mongodb.url,
			collection: config.mongodb.collection
		});
		this.tube = config.beanstalkd.tube;
	}
	async quit() {
		await this.beanstalkd.quit();
	}
}

export class Producer extends Base {
	async connect() {
		await this.beanstalkd.connect();
		await this.beanstalkd.use(this.tube);
	}
	async send(payload) {
		validate(payload);
		let id = await this.mongodb.save(payload);
		await this.beanstalkd.put({
			priority: RETRY_PRIORITY,
			delay: ZERO_DELAY,
			payload: {mongo_id: id}
		});
		return {
			mongo_id: id
		};
	}
}

export class Consumer extends Base {
	async connect() {
		await this.beanstalkd.connect();
		await this.beanstalkd.watch(this.tube);
	}
	async sendMailAndSave(mongo_id, item, jobid) {
		let vendor;
		try {
			vendor = selectAvailableVendor(jobid);

			await vendor.send(item);
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
		await this.beanstalkd.delete(job.jobid);
		return job;
	}
}

function validate(payload) {
	if (!('to' in payload && 'from' in payload && 'text' in payload && 'subject' in payload)) {
		throw new Error('Invalid payload');
	}
}

export async function run_consumer() {
	let consumer = new Consumer(config.beanstalkd);
	await consumer.connect();
	while (true) {
		let job = await consumer.recieve();
	}
}
