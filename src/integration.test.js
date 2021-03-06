import {ObjectID, MongoClient} from 'mongodb';
import {Producer} from './producer';
import {Consumer} from './consumer';
import FiveBeans from './fivebeans_wrapper';
import config from './config.json';

describe('Integration tests with beanstalkd and mongodb', () => {
	let producer;
	let consumer;

	let mongo;
	let fivebeans;

	let uri = config.test.mongodb.uri;
	let collection = config.test.mongodb.collection;
	let tube = config.test.beanstalkd.tube;
	let hostname = config.test.beanstalkd.hostname;
	let port = config.test.beanstalkd.port;

	let mongo_config = {uri, collection};
	let beanstalkd_config = {tube, hostname, port};

	beforeAll(async () => {
		producer = new Producer({mongo_config, beanstalkd_config});
		consumer = new Consumer({mongo_config, beanstalkd_config});
		await producer.connect();
		await consumer.connect();

		mongo = await MongoClient.connect(uri);

		fivebeans = new FiveBeans({hostname, port});
		await fivebeans.connect();
	});

	beforeEach(async () => {
		await mongo.collection(collection).remove();
		await fivebeans.watch(tube);
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
		let item = await mongo.collection(collection).findOne({
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

		let item = await mongo.collection(collection).findOne({
			_id: new ObjectID(job.payload.mongo_id)
		});
		// TODO clean this up
		expect(item.vendor).toMatch(/Amazon|MailGun|SendInBlue|SparkPost/);
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
		await mongo.collection(collection).remove();
		await mongo.close();

		await fivebeans.watch(tube);
		await fivebeans._danger_clear_tube();
		await fivebeans.quit();

		await producer.close();
	});
});
