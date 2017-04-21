import {ObjectID, MongoClient} from 'mongodb';

export default class Mail {
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
    async send_attempt({id, vendor, timestamp}) {
    	let db = await MongoClient.connect(this.url);
    	await db.collection(this.collection).updateOne(
    		{_id: new ObjectID(id)},
    		{
    			$set: {
    				attempts: [
                        {
                            vendor,
                            status: 'pending',
                            timestamp
                        }
                    ]
    			}
    		}
    	);
    	db.close();
    }
    async _danger_clear_collection() {
        let db = await MongoClient.connect(this.url);
    	await db.collection(this.collection).remove();
    	db.close();
    }
}
