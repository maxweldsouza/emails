import FiveBeans from './fivebeans_wrapper';
import MongoDB from './mongo';
import * as config from './config.json';

const MEASURE_THROUGHPUT_MS = 1000;

export class Base {
	constructor() {
		this.beanstalkd = new FiveBeans();
		this.mongodb = new MongoDB({
			url: config.mongodb.url,
			collection: config.mongodb.collection
		});
		this.tube = config.beanstalkd.tube;
		this.throughput_count = 0;
		this.throughput();
	}
	throughput() {
		if (this.start && this.throughput_count > 0) {
			let diff = process.hrtime(this.start);
			console.log(`${this.constructor.name} throughput is ${this.throughput_count / (diff[0] * 1e9 + diff[1]) * 1e9} ops / second`);
		}
		this.throughput_count = 0;
		this.start = process.hrtime();
		setTimeout(this.throughput.bind(this), MEASURE_THROUGHPUT_MS);
	}
	async quit() {
		await this.mongodb.close();
		await this.beanstalkd.quit();
	}
}
