import {ObjectID, MongoClient} from 'mongodb';
import {Producer, Consumer} from './index';
import FiveBeans from './fivebeans_wrapper';
import * as config from './config.json';

describe('Integration tests with beanstalkd and mongodb', () => {
	let producer;
	let consumer;

	let options = config.beanstalkd;

	let db;
	let fb = new FiveBeans(config.beanstalkd);

	beforeAll(async () => {
		producer = new Producer(options);
		consumer = new Consumer(options);
		await producer.connect();
		await consumer.connect();

		db = await MongoClient.connect(config.mongodb.url);
		await fb.connect();
	});

	beforeEach(async () => {
		// We clear our mongodb collection and beanstalkd queue before every test
		// so that our tests are isolated from each other
		await db.collection(config.mongodb.collection).remove();
		await fb.watch(config.beanstalkd.tube);
		await fb._danger_clear_tube();
	});

	test('Connects to beanstalkd', () => {
		return expect(producer).toBeInstanceOf(Producer);
	});

	test('Added job should be saved to mongodb', async () => {
		let {mongo_id} = await producer.send({
			to: 'something@example.com',
			from: 'source@domain.com',
			subject: 'Test subject',
			text: 'hello'
		});
		expect(mongo_id).toBeTruthy();
		let item = await db.collection(config.mongodb.collection).findOne({
			_id: mongo_id
		});
		expect(item).toMatchObject({
			to: 'something@example.com',
			from: 'source@domain.com',
			subject: 'Test subject',
			text: 'hello'
		});
	});

	test('Received job must only have mongo_id', async () => {
		let message = {
			to: 'something@example.com',
			from: 'source@domain.com',
			subject: 'Test subject',
			text: 'hello'
		};
		let res = await producer.send(message);
		let job = await consumer.recieve();
		expect(job.payload.mongo_id.toString()).toEqual(res.mongo_id.toString());
	});

	test('Consumer updates mongodb after sending mail', async () => {
		await producer.send({
			to: 'something@example.com',
			from: 'source@domain.com',
			subject: 'Test subject',
			text: 'hello'
		});
		let job = await consumer.recieve();

		let item = await db.collection(config.mongodb.collection).findOne({
			_id: new ObjectID(job.payload.mongo_id)
		});
		expect(item).toMatchObject({
			to: 'something@example.com',
			from: 'source@domain.com',
			subject: 'Test subject',
			text: 'hello',
			status: 'sent',
			vendor: 'amazon'
		});
	});

	test('Consumer deletes job from beanstalkd after sending mail', async () => {
		try {
			await producer.send({
				to: 'something@example.com',
				from: 'source@domain.com',
				subject: 'Test subject',
				text: 'hello'
			});
			// this will delete the job from beanstalkd and add a new job to check
			// whether the mail is sent with a higher priority
			await consumer.recieve();
			await fb.peek_ready();
		} catch (e) {
			expect(e).toEqual('NOT_FOUND');
		}
	});

	afterAll(async () => {
		await producer.quit();

		await fb.quit();
		db.close();
	});
});
