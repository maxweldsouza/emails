import fivebeans from 'fivebeans';

export default class FiveBeans {
    constructor() {
        this.client = new fivebeans.client('127.0.0.1', 11300);
    }
    connect () {
        return new Promise((resolve, reject) => {
            this.client
            .on('connect', () => {
                console.log('Connected')
                resolve('connected');
            })
            .on('error', err => {
                reject('failed');
                console.error('Couldnt connect to beanstalkd', err);
            })
            .connect();
        })
    }
    use (tube) {
        return new Promise((resolve, reject) => {
            this.client.use(tube, (err, tubename) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(tubename);
                }
            });
        })
    }
    quit () {
        return new Promise((resolve, reject) => {
            this.client
            .on('close', () => {
                resolve();
                console.log('Beanstalkd connection closed');
            })
            .on('error', err => {
                reject('failed');
                console.error('Couldnt disconnect to beanstalkd', err);
            })
            this.client.quit();
        })
    }
}
