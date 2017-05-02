import {Producer} from './producer';

import config from './config.json';

async function load_test() {
	console.log(`Load test started with PID: ${process.pid}`);
	if (process.env === 'production') {
		throw new Error('Dont run load test with NODE_ENV=production. Email sending is enabled.');
	}

	let count = 10000;

	let producer = new Producer({
		mongo_config: config.test.mongodb,
		beanstalkd_config: config.test.beanstalkd
	});
	await producer.connect();
	for (let i = 0; i < count; i++) {
		await producer.send({
			from: 'nothing@example.com',
			to: 'something@example.com',
			subject: 'Test mail',
			text: 'Hi'
		});
	}
	await producer.close();
}

load_test()
.catch((e) => {
	console.error(e);
});
