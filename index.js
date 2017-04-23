import FiveBeans from './fivebeans_wrapper';
import MongoDB from './mongo';
import * as config from './config.json';
import {unixTimestamp} from './utils';

const DEFAULT_PRIORITY = 1;
const ZERO_DELAY = 0;
const TIME_TO_RUN = 10;

function validate(payload) {
    if (!('to' in payload
    && 'from' in payload
    && 'text' in payload
    && 'subject' in payload))  {
        throw new Error('Invalid payload');
    }
}

class Base {
	constructor({hostname, port, tube}) {
		this.beanstalkd = new FiveBeans({hostname, port});
        this.mongodb = new MongoDB({ url: config.mongodb.url, collection: config.mongodb.collection });
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
        validate(payload);
        let id = await this.mongodb.save(payload);
		await this.beanstalkd.put({priority: DEFAULT_PRIORITY, delay: ZERO_DELAY, ttr: TIME_TO_RUN, payload});
	}
}

export class Consumer extends Base {
	async connect() {
		await this.beanstalkd.connect();
		await this.beanstalkd.watch(this.tube);
	}
	async recieve() {
		let job = await this.beanstalkd.reserve();
        await this.mongodb.send_attempt({ id: job.payload._id, vendor: 'amazon', timestamp: unixTimestamp() })
        return job;
	}
}
