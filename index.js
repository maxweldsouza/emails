import fivebeans from 'fivebeans';

const DEFAULT_PRIORITY = 1;
const ZERO_DELAY = 0;
const TIME_TO_RUN = 10;

export class Connection {
	constructor({client, tube}) {
		this.client = client;
	}
    _tubename () {
        return new Promise((resolve, reject) => {
            this.client.list_tube_used((err, tubename) => {
                if (err) {
                    reject(err);
                }
                resolve(tubename);
            });
        })
    }
	send() {
		return new Promise((resolve, reject) => {
			let payload = {hello: 'world'};
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

export class Producer {
	constructor({hostname, port, tube}) {
		this.client = new fivebeans.client(hostname, port);
        this.tube = tube;
	}
	connect() {
		return new Promise((resolve, reject) => {
			this.client
				.on('connect', () => {
                    this.client.use(this.tube, (err, tubename) => {
                        let connection = new Connection({
                            client: this.client,
                            tube: this.tube
                        });
                        resolve(connection);
                        console.log('Connected to beanstalkd');
                    })
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
}
