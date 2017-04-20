import fivebeans from 'fivebeans';

export class Connection {
    constructor (client) {
        this.client = client;
    }
}

export class Producer {
    constructor () {
        this.client = new fivebeans.client('127.0.0.1', 11300);
    }
    connect () {
        return new Promise((resolve, reject) => {
            this.client.on('connect', () => {
                let connection = new Connection(this.client);
                resolve (connection);
                console.log('Connected to beanstalkd');
            })
            .on('error', () => {
                reject ('failed');
                console.error('Couldnt connect to beanstalkd');
            })
            .on('close', () => {
                console.log('Beanstalkd connection closed');
            })
            .connect();
        });
    }
}
export function consumer () {
}


console.log('Started ...');
