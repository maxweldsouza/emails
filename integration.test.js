import {Producer, Consumer} from './index';
import {ObjectID, MongoClient} from 'mongodb';
import FiveBeans from './fivebeans_wrapper';

const url = 'mongodb://localhost:27017/test';

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

    beforeEach(async () => {
        // We clear our mongodb collection and beanstalkd queue before every test
        // so that our tests are isolated from each other
        let db = await MongoClient.connect(url);
        await db.collection('mails').remove();
        db.close();

        let fb = new FiveBeans();
        await fb.connect();
        await fb._danger_clear_tube();
        await fb.quit();
    })

	test('Connects to beanstalkd', () => {
		return expect(producer).toBeInstanceOf(Producer);
	});

	test('Add job to beanstalkd', async () => {
		await producer.send({message: 'hello'});
	});

	test('Receive job from beanstalkd', async () => {
		let message = {message: 'hello'};
		await producer.send(message);
		let {jobid, payload} = await consumer.recieve();
		let result = JSON.parse(payload.toString('ascii'));
		expect(result).toMatchObject({message: 'hello'});
	});

	afterAll(async () => {
		await producer._danger_clear_tube();
		await producer.quit();
	});
});
