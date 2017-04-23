import {Producer, Consumer} from './index';
import {ObjectID, MongoClient} from 'mongodb';
import FiveBeans from './fivebeans_wrapper';
import * as config from './config.json';

describe('Beanstalkd integration', () => {
	let producer;
	let consumer;

	let options = config.beanstalkd;

    let db;
    let fb;

    let sample_mail = {
        to: 'something@example.com',
        from: 'source@domain.com',
        subject: 'Test subject',
        text: 'hello'
    };

	beforeAll(async () => {
		producer = new Producer(options);
		consumer = new Consumer(options);
		await producer.connect();
		await consumer.connect();

        db = await MongoClient.connect(config.mongodb.url);
        fb = new FiveBeans();
        await fb.connect();
	});

    beforeEach(async () => {
        // We clear our mongodb collection and beanstalkd queue before every test
        // so that our tests are isolated from each other
        await db.collection(config.mongodb.collection).remove();
        await fb._danger_clear_tube();
    })

	test('Connects to beanstalkd', () => {
		return expect(producer).toBeInstanceOf(Producer);
	});

	test('Add job to beanstalkd', async () => {
		await producer.send(sample_mail);
	});

    function lastAttemptStatus (job) {
        let last = job.attempts.length - 1;
        return job.attempts[last].status;
    }

    test('Add job to mongodb', async () => {
        await producer.send(sample_mail);

        let item = await db.collection(config.mongodb.collection).findOne();
        expect(item).toMatchObject(sample_mail);
        expect(lastAttemptStatus(item)).toBe('sent');
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

        await fb.quit();
        db.close();
	});
});
