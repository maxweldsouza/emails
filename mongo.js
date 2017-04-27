import {ObjectID, MongoClient} from 'mongodb';
import * as config from './config.json';

export default class MongoDB {
	constructor() {
		this.url = config.mongodb.url;
		this.collection = config.mongodb.collection;
	}
	async save(mail) {
		let db = await MongoClient.connect(this.url);
		let res = await db.collection(this.collection).insertOne(mail);
		db.close();
		return res.insertedId;
	}
	async get(mongo_id) {
		let db = await MongoClient.connect(this.url);
		return await db.collection(this.collection).findOne({
			_id: new ObjectID(mongo_id)
		});
	}
	async save_attempt({id, vendor, timestamp}) {
		let db = await MongoClient.connect(this.url);
		await db.collection(this.collection).updateOne(
			{_id: new ObjectID(id)},
			{
				$set: {
					vendor,
					status: 'sent',
					timestamp
				}
			}
		);
		db.close();
	}
}
