import {ObjectID, MongoClient} from 'mongodb';

export function lastAttemptStatus(job) {
	let last = job.attempts.length - 1;
	return job.attempts[last].status;
}

export function noAttemptsYet (item) {
    return !('attempts' in item && item.attempts.length > 0);
}

export function lastMailBounced(item) {
    return lastAttemptStatus(item) === 'bounced';
}

export function lastMailNeedsToBeChecked (item) {
    return lastAttemptStatus(item) === 'pending';
}

export function lastMailDelivered (item) {
    return lastAttemptStatus(item) === 'delivered';
}

export default class MongoDB {
	constructor({url, collection}) {
		this.url = url;
		this.collection = collection;
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
            _id: mongo_id
        });
    }
	async send_attempt({id, vendor, timestamp}) {
		let db = await MongoClient.connect(this.url);
		await db.collection(this.collection).updateOne(
			{_id: new ObjectID(id)},
			{
				$set: {
					attempts: [
						{
							vendor,
							status: 'sent',
							timestamp
						}
					]
				}
			}
		);
		db.close();
	}
	async update_attempt({id, timestamp, status}) {
		let db = await MongoClient.connect(this.url);
		let item = await db.collection(this.collection).findOne({_id: new ObjectID(id)});
		let last = item.attempts.length - 1;
		item.attempts[last].status = status;
		await db.collection(this.collection).updateOne(
			{_id: new ObjectID(id)},
			{
				$set: {
					attempts: item.attempts
				}
			}
		);
		db.close();
	}
}
