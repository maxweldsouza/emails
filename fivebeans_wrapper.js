import fivebeans from 'fivebeans';

export default class FiveBeans {
    constructor() {
        this.client = new fivebeans.client('127.0.0.1', 11300);
    }
    connect () {
        return new Promise((resolve, reject) => {
            this.client
            .on('connect', () => {
                resolve();
            })
            .on('error', err => {
                reject(err);
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
    list_tube_used () {
        return new Promise((resolve, reject) => {
            this.client.list_tube_used((err, tubename) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(tubename);
                }
            })
        })
    }
    watch (tube) {
        return new Promise((resolve, reject) => {
            this.client.watch(tube, (err, tubename) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(tubename);
                }
            });
        })
    }
    put ({ priority, delay, payload }) {
        return new Promise((resolve, reject) => {
            this.client.put(priority, delay, 0, JSON.stringify(payload), (err, jobid) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(jobid);
                }
            })
        })
    }
    reserve () {
        return new Promise((resolve, reject) => {
            this.client.reserve((err, jobid, payload) => {
                if (err) {
                    reject(err);
                } else {
                    resolve({jobid, payload});
                }
            })
        })
    }
    delete (jobid) {
        return new Promise((resolve, reject) => {
            this.client.destroy(jobid, (err) => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            })
        })
    }
    quit () {
        return new Promise((resolve, reject) => {
            this.client
            .on('close', () => {
                resolve();
            })
            .on('error', err => {
                reject('failed');
            })
            this.client.quit();
        })
    }
    _delete_all_ready(callback) {
        this.client.peek_ready((err, jobid) => {
            if (err === 'NOT_FOUND') {
                callback(null);
                console.log('All ready jobs deleted');
            } else if (err) {
                callback(err);
                console.error('Could not peek ready jobs', err);
            } else {
                this.client.destroy(jobid, error => {
                    if (error) {
                        callback(err);
                        console.error('Could not delete job', error);
                    } else {
                        this._delete_all_ready(callback);
                    }
                });
            }
        });
    }
}
