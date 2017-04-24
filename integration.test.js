import {Producer, Consumer} from './index';
import {ObjectID, MongoClient} from 'mongodb';
import FiveBeans from './fivebeans_wrapper';
import * as config from './config.json';
import { lastAttemptStatus } from './mongo';

describe('Beanstalkd integration', () => {
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

    test('Consumer adds job to mongodb', async () => {
        await producer.send({
            to: 'something@example.com',
            from: 'source@domain.com',
            subject: 'Test subject',
            text: 'hello'
        });
        let {jobid, payload} = await consumer.recieve();

        let item = await db.collection(config.mongodb.collection).findOne({_id: new ObjectID(payload._id)});
        expect(item).toMatchObject({
            to: 'something@example.com',
            from: 'source@domain.com',
            subject: 'Test subject',
            text: 'hello'
        });
        expect(lastAttemptStatus(item)).toBe('sent');
    });

    test('Consumer deletes job from beanstalkd after sending mail', async () => {
        await producer.send({
            to: 'something@example.com',
            from: 'source@domain.com',
            subject: 'Test subject',
            text: 'hello'
        });
        // this will delete the job from beanstalkd and add a new job to check
        // whether the mail is sent with a higher priority
        await consumer.recieve();
        let {jobid, payload} = await consumer.recieve();
        console.log(jobid, payload)
    });

	afterAll(async () => {
		await producer.quit();

        await fb.quit();
        db.close();
	});
});
