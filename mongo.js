import {ObjectID, MongoClient} from 'mongodb';

const url = 'mongodb://localhost:27017/test';

export async function save(mail) {
	let db = await MongoClient.connect(url);
	let res = await db.collection('mails').insertOne(mail);
	db.close();
    return res.insertedId;
}

export async function send_attempt({vendor, timestamp}) {
	let db = await MongoClient.connect(url);
	await db.collection('mails').updateOne(
		{_id: new ObjectID('58f9fb5750364a4b7ba89b1d')},
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

export async function _danger_clear_collection() {
    let db = await MongoClient.connect(url);
	await db.collection('mails').remove();
	db.close();
}
