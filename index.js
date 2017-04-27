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

	let vendor = vendors[parseInt(jobid, 10) % availableVendors.length];
	return vendor;
}

class Base {
	constructor({hostname, port, tube}) {
		this.beanstalkd = new FiveBeans({hostname, port});
		this.mongodb = new MongoDB({
			url: config.mongodb.url,
			collection: config.mongodb.collection
		});
		this.tube = tube;
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
		console.log(payload);
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
			vendor: 'amazon',
			timestamp: unixTimestamp()
		});
		await vendor.send(item);
	}
	async recieve() {
		let job = await this.beanstalkd.reserve();
		let mongo_id = job.payload.mongo_id;
		let item = await this.mongodb.get(mongo_id);

		let vendor = selectVendor(job.jobid);
		console.log(vendor.constructor.name);
		try {
			await this.sendMailAndSave(vendor, mongo_id, item);
		} catch (e) {
			console.log(e);
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
		console.log(job);
	}
}
