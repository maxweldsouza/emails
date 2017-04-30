import {Producer} from './producer';

import * as config from './config.json';

async function process_test() {
	if (process.env === 'production') {
		throw new Error('Dont run load test with NODE_ENV=production. Email sending is enabled.')
	}

	let count = 10000;

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
	await producer.quit();
}

process_test().then(() => {
})
.catch((err) => {
	console.error(err);
});
