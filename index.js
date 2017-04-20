import fivebeans from 'fivebeans';

let client = new fivebeans.client('127.0.0.1', 11300);

export function consumer ( callback ) {
    client.on('connect', () => {
        callback(null, 'connected');
        console.log('Connected to beanstalkd');
    })
    .on('error', () => {
        callback(null);
        console.error('Couldnt connect to beanstalkd');
    })
    .on('close', () => {
        console.log('Beanstalkd connection closed');
    })
    .connect();
}


console.log('Started ...');
