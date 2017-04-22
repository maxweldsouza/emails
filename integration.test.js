import {Producer, Consumer} from './index';
import {ObjectID, MongoClient} from 'mongodb';
import FiveBeans from './fivebeans_wrapper';
import * as config from './config.json';

describe('Beanstalkd integration', () => {
	let producer;
	let consumer;

	let options = config.beanstalkd;

	beforeAll(async () => {
		producer = new Producer(options);
		consumer = new Consumer(options);
		await producer.connect();
		await consumer.connect();
	});

    beforeEach(async () => {
        // We clear our mongodb collection and beanstalkd queue before every test
        // so that our tests are isolated from each other
        let db = await MongoClient.connect(config.mongodb.url);
        await db.collection(config.mongodb.collection).remove();
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
		await producer.send({
            to: 'something@example.com',
            from: 'source@domain.com',
            subject: 'Test subject',
            text: 'hello'
        });
	});

	test('Receive job from beanstalkd', async () => {
		let message = {
            to: 'something@example.com',
            from: 'source@domain.com',
            subject: 'Test subject',
            text: 'hello'
        };
		await producer.send(message);
		let {jobid, payload} = await consumer.recieve();
		expect(payload).toMatchObject({
            to: 'something@example.com',
            from: 'source@domain.com',
            subject: 'Test subject',
            text: 'hello'
        });
	});

	afterAll(async () => {
		await producer._danger_clear_tube();
		await producer.quit();
	});
});
