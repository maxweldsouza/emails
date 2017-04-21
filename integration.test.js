import {Producer, Consumer} from './index';

describe('Beanstalkd integration', () => {
	let producer;
	let consumer;

	let options = {
		hostname: '127.0.0.1',
		port: 11300,
		tube: 'test_integration'
	};

	beforeAll(async () => {
		producer = new Producer(options);
		consumer = new Consumer(options);
		await producer.connect();
        await consumer.connect();
	});

	test('Connects to beanstalkd', () => {
		return expect(producer).toBeInstanceOf(Producer);
	});

	test('Correct tube used', async () => {
		let tubename = await producer._tubename();
        expect(tubename).toBe(options.tube);
	});

	test('Add job to beanstalkd', async () => {
		await producer.send({message: 'hello'});
	});

	test('Receive job from beanstalkd', async () => {
		let message = {message: 'hello'};
		await producer.send(message);
		let {jobid, payload} = await consumer.recieve();
		let result = JSON.parse(payload.toString('ascii'));
		expect(result).toEqual(message);
	});

	afterAll(async () => {
		await producer._delete_all_ready();
        await producer.quit();
	});
});
