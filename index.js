import FiveBeans from './fivebeans_wrapper';
import MongoDB from './mongo';
import * as config from './config.json';
import {unixTimestamp} from './utils';
import Amazon from './amazon';
import Sparkpost from './sparkpost';

const DEFAULT_PRIORITY = 0;
const ZERO_DELAY = 0;
const TIME_TO_RUN = 10;

let vendors = [Amazon, Sparkpost];

function selectVendor(jobid) {
	let availableVendors = vendors.filter(vendor => vendor.available);

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
			priority: DEFAULT_PRIORITY,
			delay: ZERO_DELAY,
			ttr: TIME_TO_RUN,
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
	async sendMailAndSave(vendor, mongo_id, item) {
		await this.mongodb.save_attempt({
			id: item._id,
			vendor: vendor.constructor.name,
			timestamp: unixTimestamp()
		});
		await vendor.send(item);
	}
	async recieve() {
		let job = await this.beanstalkd.reserve();
		let mongo_id = job.payload.mongo_id;
		let item = await this.mongodb.get(mongo_id);

		let vendor = selectVendor(job.jobid);
		try {
			await this.sendMailAndSave(vendor, mongo_id, item);
		} catch (e) {
			// TODO add to queue again
			console.error(e);
		}
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
