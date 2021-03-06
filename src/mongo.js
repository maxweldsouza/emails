import {ObjectID, MongoClient} from 'mongodb';
import config from './config.json';

export default class MongoDB {
	constructor({uri, collection}) {
		this.uri = uri;
		this.collection = collection;
	}
	async connect() {
		this.conn = await MongoClient.connect(this.uri);
		this.pipe = this.conn.collection(this.collection);
	}
	async close() {
		this.conn.close();
	}
	async save(mail) {
		let res = await this.pipe.insertOne(mail);
		return res.insertedId;
	}
	async get(mongo_id) {
		return await this.pipe.findOne({
			_id: new ObjectID(mongo_id)
		});
	}
	async save_attempt({id, vendor, timestamp}) {
		await this.pipe.updateOne(
			{_id: new ObjectID(id)},
			{
				$set: {
					vendor,
					status: 'sent',
					timestamp
				}
			}
		);
	}
}
