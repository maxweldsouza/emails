import fivebeans from 'fivebeans';

const DEFAULT_PRIORITY = 1;
const ZERO_DELAY = 0;
const TIME_TO_RUN = 10;

class Base {
	constructor({hostname, port, tube}) {
		this.client = new fivebeans.client(hostname, port);
		this.tube = tube;
	}
	_tubename() {
		return new Promise((resolve, reject) => {
			this.client.list_tube_used((err, tubename) => {
				if (err) {
					reject(err);
				}
				resolve(tubename);
			});
		});
	}
	_delete_all_ready(callback) {
		this.client.peek_ready((err, jobid) => {
			if (err === 'NOT_FOUND') {
				callback();
				console.log('All ready jobs deleted');
			} else if (err) {
				console.error('Could not peek ready jobs', err);
			} else {
				this.client.destroy(jobid, error => {
					if (error) {
						console.error('Could not delete job', error);
					} else {
						this._delete_all_ready(callback);
					}
				});
			}
		});
	}
	quit() {
		return new Promise((resolve, reject) => {
			this.client.quit(() => {
				resolve();
			});
		});
	}
}

export class Producer extends Base {
	connect() {
		return new Promise((resolve, reject) => {
			this.client
				.on('connect', () => {
					this.client.use(this.tube, (err, tubename) => {
						resolve(this);
						console.log('Connected to beanstalkd');
					});
				})
				.on('error', err => {
					reject('failed');
					console.error('Couldnt connect to beanstalkd', err);
				})
				.on('close', () => {
					console.log('Beanstalkd connection closed');
				})
				.connect();
		});
	}
	send(payload) {
		return new Promise((resolve, reject) => {
			this.client.put(DEFAULT_PRIORITY, ZERO_DELAY, TIME_TO_RUN, JSON.stringify(payload), (err, jobid) => {
				if (err) {
					reject();
				} else {
					console.log(`Job added ${jobid}`);
					resolve(this);
				}
			});
		});
	}
}

export class Consumer extends Base {
	connect() {
		return new Promise((resolve, reject) => {
			this.client
				.on('connect', () => {
					this.client.watch(this.tube, (err, tubename) => {
						resolve(this);
						console.log('Connected to beanstalkd');
					});
				})
				.on('error', err => {
					reject('failed');
					console.error('Couldnt connect to beanstalkd', err);
				})
				.on('close', () => {
					console.log('Beanstalkd connection closed');
				})
				.connect();
		});
	}
	recieve() {
		return new Promise((resolve, reject) => {
			this.client.reserve_with_timeout(3, (err, jobid, payload) => {
				if (err) {
					reject(err);
				} else {
					resolve(payload);
				}
			});
		});
	}
}
