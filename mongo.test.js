import MongoDB from './mongo';
import {unixTimestamp} from './utils';
import {ObjectID, MongoClient} from 'mongodb';
import * as config from './config.json';

describe('Mongodb integration', () => {
	let mongodb;
	let db;
	let payload = {
		to: 'something@example.com',
		from: 'source@domain.com',
		subject: 'Test subject',
		body: 'hello'
	};
	const collection = 'test_mongo_collection';

	beforeAll(async () => {
		mongodb = new MongoDB({url: config.mongodb.url, collection});
		db = await MongoClient.connect(config.mongodb.url);
	});

	beforeEach(async () => {
		await db.collection(collection).remove();
	});

	test('Save mail to mongodb', async () => {
		let id = await mongodb.save(payload);
		expect(id).toBeTruthy();
		let db = await MongoClient.connect(config.mongodb.url);
		db.close();
	});

	test('Add send attempt', async () => {
		let id = await mongodb.save(payload);
		await mongodb.save_attempt({id, vendor: 'amazon', timestamp: unixTimestamp()});

		let item = await db.collection(collection).findOne({
			_id: new ObjectID(id)
		});
		expect(item.status).toBe('sent');
		expect(item.vendor).toBe('amazon');
	});

	afterAll(() => {
		db.close();
	});
});
