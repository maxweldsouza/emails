import {ObjectID, MongoClient} from 'mongodb';

const url = 'mongodb://localhost:27017/test';

export async function save(mail) {
	let db = await MongoClient.connect(url);
	db.collection('mails').insertOne(mail);
	db.close();
}

export async function send_attempt({vendor, timestamp}) {
	let db = await MongoClient.connect(url);
	db.collection('mails').updateOne(
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
