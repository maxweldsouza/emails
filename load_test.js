import {Producer, run_consumer} from './index';
import * as config from './config.json';

async function process_test() {
	if (process.env === 'production') {
		throw new Error('Dont run load test with NODE_ENV=production. Email sending is enabled.')
	}

	let count = 10000;

	// let start = process.hrtime();

	let producer = new Producer(config.beanstalkd);
	await producer.connect();
	for (let i = 0; i < count; i++) {
		await producer.send({
			from: 'mail@comparnion.com',
			to: 'maxellusionist@gmail.com',
			subject: 'Test mail',
			text: 'Hi'
		});
	}
	// let diff = process.hrtime(start);
	// console.log(`Producer throughput is ${count / (diff[0] * 1e9 + diff[1]) * 1e9} ops / second`);

	// start = process.hrtime();
	await run_consumer();
	// diff = process.hrtime(start);
	// console.log(`Consumer throughput is ${count / (diff[0] * 1e9 + diff[1]) * 1e9} ops / second`);
}

process_test().then(() => {
})
.catch((err) => {
	console.error(err);
});
