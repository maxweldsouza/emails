import fivebeans from 'fivebeans';
import * as config from './config.json';

export default class FiveBeans {
	constructor() {
		this.client = new fivebeans.client(config.beanstalkd.hostname, config.beanstalkd.port);
	}
	connect() {
		return new Promise((resolve, reject) => {
			this.client
			.on('connect', () => {
				resolve();
			})
			.on('error', err => {
				reject(err);
			})
			.connect();
		});
	}
	use(tube) {
		return new Promise((resolve, reject) => {
			this.client.use(tube, (err, tubename) => {
				if (err) {
					reject(err);
				} else {
					resolve(tubename);
				}
			});
		});
	}
	list_tube_used() {
		return new Promise((resolve, reject) => {
			this.client.list_tube_used((err, tubename) => {
				if (err) {
					reject(err);
				} else {
					resolve(tubename);
				}
			});
		});
	}
	watch(tube) {
		return new Promise((resolve, reject) => {
			this.client.watch(tube, (err, tubename) => {
				if (err) {
					reject(err);
				} else {
					resolve(tubename);
				}
			});
		});
	}
	put({priority, delay, payload}) {
		return new Promise((resolve, reject) => {
			this.client.put(priority, delay, 30, JSON.stringify(payload), (err, jobid) => {
				if (err) {
					reject(err);
				} else {
					resolve(jobid);
				}
			});
		});
	}
	reserve_with_timeout(seconds) {
		return new Promise((resolve, reject) => {
			this.client.reserve_with_timeout(seconds, (err, jobid, payload) => {
				if (err) {
					reject(err);
				} else {
					resolve({
						jobid,
						payload: JSON.parse(payload.toString())
					});
				}
			});
		});
	}
	reserve() {
		return new Promise((resolve, reject) => {
			this.client.reserve((err, jobid, payload) => {
				if (err) {
					reject(err);
				} else {
					resolve({
						jobid,
						payload: JSON.parse(payload.toString())
					});
				}
			});
		});
	}
	peek_ready() {
		return new Promise((resolve, reject) => {
			this.client.peek_ready((err, jobid, payload) => {
				if (err) {
					reject(err);
				} else {
					resolve({jobid, payload});
				}
			});
		});
	}
	delete(jobid) {
		return new Promise((resolve, reject) => {
			this.client.destroy(jobid, err => {
				if (err) {
					reject(err);
				} else {
					resolve();
				}
			});
		});
	}
	quit() {
		return new Promise((resolve, reject) => {
			this.client
			.on('close', () => {
				resolve();
			})
			.on('error', err => {
				reject('failed');
			});
			this.client.quit();
		});
	}
	async _danger_clear_tube() {
		// Use scary names to avoid unintentional use
		// This is required only for testing
		let result;
		try {
			result = await this.reserve_with_timeout(0.1);
			while (result.jobid) {
				await this.delete(result.jobid);
				result = await this.reserve_with_timeout(0.1);
			}
		} catch (e) {
			if (e !== 'TIMED_OUT') {
				throw e;
			}
		}
	}
}
