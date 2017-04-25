import FiveBeans from './fivebeans_wrapper';
import MongoDB from './mongo';
import * as config from './config.json';
import {unixTimestamp} from './utils';
import Amazon from './amazon';

const DEFAULT_PRIORITY = 0;
const ZERO_DELAY = 0;
const TIME_TO_RUN = 10;
const TEN_MINUTES = 10 * 60;

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
	async _danger_clear_tube() {
		await this.beanstalkd._danger_clear_tube();
	}
}

export class Producer extends Base {
	async connect() {
		await this.beanstalkd.connect();
		await this.beanstalkd.use(this.tube);
	}
	async send(payload) {
		try {
			validate(payload);
			let id = await this.mongodb.save(payload);
			let jobid = await this.beanstalkd.put({
				priority: DEFAULT_PRIORITY,
				delay: ZERO_DELAY,
				ttr: TIME_TO_RUN,
				payload: {mongo_id: payload._id}
			});
			return {
				mongo_id: payload._id
			};
		} catch (e) {
			console.error(e);
		}
	}
}

export class Consumer extends Base {
	async connect() {
		await this.beanstalkd.connect();
		await this.beanstalkd.watch(this.tube);
	}
    async attemptFirstMailAndSaveToMongo (mongo_id, item) {
        await this.mongodb.save_attempt({
            id: item._id,
            vendor: 'amazon',
            timestamp: unixTimestamp()
        });
        await Amazon.send(item);
    }
	async recieve() {
		let job = await this.beanstalkd.reserve();
        let mongo_id = job.payload.mongo_id;
        let item = await this.mongodb.get(mongo_id);

        await this.attemptFirstMailAndSaveToMongo(mongo_id, item);
		await this.beanstalkd.delete(job.jobid);
		return job;
	}
}

function validate(payload) {
	if (!('to' in payload && 'from' in payload && 'text' in payload && 'subject' in payload)) {
		throw new Error('Invalid payload');
	}
}
