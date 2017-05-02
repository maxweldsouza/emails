import {ObjectID, MongoClient} from 'mongodb';
import MongoDB from './mongo';
import config from './config.json';

describe('Mongodb integration', () => {
	let mongodb;
	let db;
	let payload = {
		to: 'something@example.com',
		from: 'source@domain.com',
		subject: 'Test subject',
		body: 'hello'
	};
	let uri = config.test.mongodb.uri;
	let collection = config.test.mongodb.collection;

	beforeAll(async () => {
		mongodb = new MongoDB({uri, collection});
		await mongodb.connect();

		db = await MongoClient.connect(uri);
	});

	beforeEach(async () => {
		await db.collection(collection).remove();
	});

	test('Save mail to mongodb', async () => {
		let id = await mongodb.save(payload);
		expect(id).toBeTruthy();
	});

	test('Add send attempt', async () => {
		let id = await mongodb.save(payload);
		await mongodb.save_attempt({id, vendor: 'amazon', timestamp: new Date()});

		let item = await db.collection(collection).findOne({
			_id: new ObjectID(id)
		});
		expect(item.status).toBe('sent');
		expect(item.vendor).toBe('amazon');
	});

	afterAll(async () => {
		await db.collection(collection).remove();
		await db.close();

		await mongodb.close();
	});
});
