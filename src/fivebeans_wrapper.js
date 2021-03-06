import fivebeans from 'fivebeans';

const CLEAR_TUBE_RESERVE_TIMEOUT_SECS = 0.1;
const TIME_TO_RUN_SECS = 30;

export default class FiveBeans {
	constructor({hostname, port}) {
		this.client = new fivebeans.client(hostname, port);
	}
	connect() {
		return new Promise((resolve, reject) => {
			this.client.on('connect', () => resolve()).on('error', e => reject(e)).connect();
		});
	}
	use(tube) {
		return new Promise((resolve, reject) => {
			this.client.use(tube, (e, tubename) => {
				if (e) {
					reject(e);
				} else {
					resolve(tubename);
				}
			});
		});
	}
	list_tube_used() {
		return new Promise((resolve, reject) => {
			this.client.list_tube_used((e, tubename) => {
				if (e) {
					reject(e);
				} else {
					resolve(tubename);
				}
			});
		});
	}
	watch(tube) {
		return new Promise((resolve, reject) => {
			this.client.watch(tube, (e, tubename) => {
				if (e) {
					reject(e);
				} else {
					resolve(tubename);
				}
			});
		});
	}
	put({priority, delay, payload}) {
		return new Promise((resolve, reject) => {
			this.client.put(priority, delay, TIME_TO_RUN_SECS, JSON.stringify(payload), (e, jobid) => {
				if (e) {
					reject(e);
				} else {
					resolve(jobid);
				}
			});
		});
	}
	reserve_with_timeout(seconds) {
		return new Promise((resolve, reject) => {
			this.client.reserve_with_timeout(seconds, (e, jobid, payload) => {
				if (e) {
					reject(e);
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
			this.client.reserve((e, jobid, payload) => {
				if (e) {
					reject(e);
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
			this.client.peek_ready((e, jobid, payload) => {
				if (e) {
					reject(e);
				} else {
					resolve({jobid, payload});
				}
			});
		});
	}
	delete(jobid) {
		return new Promise((resolve, reject) => {
			this.client.destroy(jobid, e => {
				if (e) {
					reject(e);
				} else {
					resolve();
				}
			});
		});
	}
	quit() {
		return new Promise((resolve, reject) => {
			this.client.on('close', () => resolve()).on('error', e => reject(e));
			this.client.quit();
		});
	}
	async _danger_clear_tube() {
		// Use scary names to avoid unintentional use
		// This is required only for testing
		let result;
		try {
			result = await this.reserve_with_timeout(CLEAR_TUBE_RESERVE_TIMEOUT_SECS);
			while (result.jobid) {
				await this.delete(result.jobid);
				result = await this.reserve_with_timeout(CLEAR_TUBE_RESERVE_TIMEOUT_SECS);
			}
		} catch (e) {
			if (e !== 'TIMED_OUT') {
				throw e;
			}
		}
	}
}
