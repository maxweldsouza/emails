import {ObjectID, MongoClient} from 'mongodb';
import {Producer, Consumer} from './index';
import FiveBeans from './fivebeans_wrapper';
import * as config from './config.json';

describe('Integration tests with beanstalkd and mongodb', () => {
	let producer;
	let consumer;

	let mongo;
	let fivebeans;

	beforeAll(async () => {
		producer = new Producer();
		consumer = new Consumer();
		await producer.connect();
		await consumer.connect();

		mongo = await MongoClient.connect(config.mongodb.url);

		fivebeans = new FiveBeans();
		await fivebeans.connect();
	});

	beforeEach(async () => {
		await mongo.collection(config.mongodb.collection).remove();
		await fivebeans.watch(config.beanstalkd.tube);
		await fivebeans._danger_clear_tube();
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
		let item = await mongo.collection(config.mongodb.collection).findOne({
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

		let item = await mongo.collection(config.mongodb.collection).findOne({
			_id: new ObjectID(job.payload.mongo_id)
		});
		// TODO clean this up
		expect(item.vendor).toMatch(/Amazon|SparkPost/);
		expect(item).toMatchObject({
			to: 'something@example.com',
			from: 'source@domain.com',
			subject: 'Test subject',
			text: 'hello'
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
			await consumer.recieve();
			await fivebeans.peek_ready();
		} catch (e) {
			expect(e).toEqual('NOT_FOUND');
		}
	});

	afterAll(async () => {
		await producer.quit();

		await fivebeans.quit();
		mongo.close();
	});
});
