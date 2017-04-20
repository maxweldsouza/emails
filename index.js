import fivebeans from 'fivebeans';

let client = new fivebeans.client('127.0.0.1', 11300);

export function consumer () {
    return new Promise(function(resolve, reject) {
        client.on('connect', () => {
            resolve ('connected');
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


console.log('Started ...');
