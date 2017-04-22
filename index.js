import FiveBeans from './fivebeans_wrapper';
import MongoDB from './mongo';

const DEFAULT_PRIORITY = 1;
const ZERO_DELAY = 0;
const TIME_TO_RUN = 10;

class Base {
	constructor({hostname, port, tube}) {
		this.client = new FiveBeans({hostname, port});
        this.mongodb = new MongoDB({ url: 'mongodb://localhost:27017/test', collection: 'mails' });
		this.tube = tube;
	}
	async quit() {
		await this.client.quit();
	}
	async _danger_clear_tube() {
		await this.client._danger_clear_tube();
	}
}

export class Producer extends Base {
	async connect() {
		await this.client.connect();
		await this.client.use(this.tube);
	}
	async send(payload) {
        await this.mongodb.save(payload);
		await this.client.put({priority: DEFAULT_PRIORITY, delay: ZERO_DELAY, ttr: TIME_TO_RUN, payload});
	}
}

export class Consumer extends Base {
	async connect() {
		await this.client.connect();
		await this.client.watch(this.tube);
	}
	async recieve() {
		let job = await this.client.reserve();
        console.log(job)
        return job;
	}
}
