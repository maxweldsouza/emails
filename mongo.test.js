import MongoDB from './mongo';
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
	const collection = config.mongodb.collection;

	beforeAll(async () => {
		mongodb = new MongoDB();
		await mongodb.connect();

		db = await MongoClient.connect(config.mongodb.url);
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

	afterAll(() => {
		mongodb.close();

		db.close();
	});
});
