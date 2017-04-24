import FiveBeans from './fivebeans_wrapper';
import MongoDB from './mongo';
import * as config from './config.json';
import {unixTimestamp} from './utils';
import {noAttemptsYet, lastMailBounced, lastMailDelivered, lastMailNeedsToBeChecked} from './mongo';

const DEFAULT_PRIORITY = 0;
const ZERO_DELAY = 0;
const TIME_TO_RUN = 10;
const TEN_MINUTES = 10 * 60;

function validate(payload) {
	if (!('to' in payload && 'from' in payload && 'text' in payload && 'subject' in payload)) {
		throw new Error('Invalid payload');
	}
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
	async recieve() {
		try {
			let job = await this.beanstalkd.reserve();
            let item = this.mongodb.get(job.payload.mongo_id);
            if (noAttemptsYet(item)) {
                await this.mongodb.send_attempt({
                    id: job.payload.mongo_id,
                    vendor: 'amazon',
                    timestamp: unixTimestamp()
                });
                await this.beanstalkd.put({
                    priority: DEFAULT_PRIORITY,
                    delay: ZERO_DELAY,
                    ttr: TIME_TO_RUN,
                    payload: job.payload
                });
            } else if (lastMailBounced(item)) {
                await this.mongodb.send_attempt({
                    id: job.payload.mongo_id,
                    vendor: 'amazon',
                    timestamp: unixTimestamp()
                });
                await this.beanstalkd.put({
                    priority: DEFAULT_PRIORITY,
                    delay: ZERO_DELAY,
                    ttr: TIME_TO_RUN,
                    payload: job.payload
                });
            } else if (lastMailNeedsToBeChecked(item)) {
            } else if (lastMailDelivered(item)) {
                // Dont do anything
            } else {
                throw new Error ('Unexpected state');
            }
			await this.beanstalkd.delete(job.jobid);
			return job;
		} catch (e) {
			console.error(e);
		}
	}
}
