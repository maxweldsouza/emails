import FiveBeans from './fivebeans_wrapper';

const DEFAULT_PRIORITY = 1;
const ZERO_DELAY = 0;
const TIME_TO_RUN = 10;

class Base {
	constructor({hostname, port, tube}) {
		this.client = new FiveBeans({hostname, port});
		this.tube = tube;
	}
	async _tubename() {
        return await this.client.list_tube_used();
	}
	async quit() {
        await this.client.quit();
	}
    _delete_all_ready () {
        return new Promise((resolve, reject) => {
            this.client._delete_all_ready((err) => {
                if (err) {
                    reject();
                } else {
                    resolve();
                }
            })
        })
    }
}

export class Producer extends Base {
	async connect () {
        await this.client.connect();
        await this.client.use(this.tube);
	}
	async send(payload) {
        await this.client.put({ priority: DEFAULT_PRIORITY, delay: ZERO_DELAY, ttr: TIME_TO_RUN, payload })
	}
}

export class Consumer extends Base {
    async connect () {
        await this.client.connect();
        await this.client.watch(this.tube);
	}
	async recieve() {
        return await this.client.reserve();
    }
}
