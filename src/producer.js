import {Base} from './base.js';

const RETRY_PRIORITY = 4;
const ZERO_DELAY = 0;

export class Producer extends Base {
	async connect() {
		await this.beanstalkd.connect();
		await this.beanstalkd.use(this.tube);

		await this.mongodb.connect();
	}
	async send(payload) {
		validate(payload);
		let id = await this.mongodb.save(payload);
		await this.beanstalkd.put({
			priority: RETRY_PRIORITY,
			delay: ZERO_DELAY,
			payload: {mongo_id: id}
		});
		this.throughput_count++;
		return {
			mongo_id: id
		};
	}
}

function validate(payload) {
	if (!('to' in payload && 'from' in payload && 'text' in payload && 'subject' in payload)) {
		throw new Error('Invalid payload');
	}
}
