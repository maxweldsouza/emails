import Mail from './mongo';
import {unixTimestamp} from './utils';
import {ObjectID, MongoClient} from 'mongodb';

const url = 'mongodb://localhost:27017/test';

describe('Mongodb integration', () => {
    let mail;
    let payload = {
        to: 'something@example.com',
        from: 'source@domain.com',
        subject: 'Test subject'
    };

    beforeAll(() => {
        mail = new Mail({url, collection: 'mails'});
    })

    test('Save mail to mongodb', async () => {
        let id = await mail.save(payload);
        expect(id).toBeTruthy();
        let db = await MongoClient.connect(url);
        await db.collection('mails').deleteOne({
            _id: new ObjectID(id)
        });
        db.close();
    });

    test('Add send attempt', async () => {
        let id = await mail.save(payload);
        await mail.send_attempt({id, vendor: 'amazon', timestamp: unixTimestamp()});

        let db = await MongoClient.connect(url);
        let item = await db.collection('mails').findOne({
            _id: new ObjectID(id)
        });
        expect(item.attempts.length).toBe(1);
        await db.collection('mails').deleteOne({
            _id: new ObjectID(id)
        });
        db.close();
    });
});
