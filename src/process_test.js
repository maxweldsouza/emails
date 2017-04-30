import {Producer, run_consumer} from './index';
import * as config from './config.json';

async function process_test() {
	let producer = new Producer(config.beanstalkd);
	await producer.connect();
	for (let i = 0; i < 10; i++) {
		await producer.send({
			from: 'mail@comparnion.com',
			to: 'maxellusionist@gmail.com',
			subject: 'Test mail',
			text: 'Hi'
		});
	}
	await run_consumer();
}

process_test().then(() => {
})
.catch((err) => {
	console.error(err);
});
