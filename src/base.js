import FiveBeans from './fivebeans_wrapper';
import MongoDB from './mongo';
import config from './config.json';

const MEASURE_THROUGHPUT_MS = 1000;

export class Base {
	constructor({mongo_config, beanstalkd_config}) {
		this.beanstalkd = new FiveBeans(beanstalkd_config);
		this.mongodb = new MongoDB(mongo_config);
		this.tube = beanstalkd_config.tube;
		this.throughput_count = 0;
		if (config.measure_throughput) {
			this.throughput();
		}
	}
	throughput() {
		if (this.start && this.throughput_count > 0) {
			let diff = process.hrtime(this.start);
			console.log(`${this.constructor.name} PID:${process.pid} Throughput: ${this.throughput_count / (diff[0] * 1e9 + diff[1]) * 1e9} ops / second`);
		}
		this.throughput_count = 0;
		this.start = process.hrtime();
		setTimeout(this.throughput.bind(this), MEASURE_THROUGHPUT_MS);
	}
	async close() {
		await this.mongodb.close();
		await this.beanstalkd.quit();
	}
}
