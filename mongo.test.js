import MongoDB from './mongo';
import {unixTimestamp} from './utils';
import {ObjectID, MongoClient} from 'mongodb';
import * as config from './config.json';


describe('Mongodb integration', () => {
    let mongodb;
    let payload = {
        to: 'something@example.com',
        from: 'source@domain.com',
        subject: 'Test subject',
        body: 'hello'
    };

    beforeAll(() => {
        mongodb = new MongoDB(config.mongodb);
    })

    beforeEach( async () => {
        let db = await MongoClient.connect(config.mongodb.url);
        await db.collection(config.mongodb.collection).remove();
        db.close();
    })

    test('Save mail to mongodb', async () => {
        let id = await mongodb.save(payload);
        expect(id).toBeTruthy();
        let db = await MongoClient.connect(config.mongodb.url);
        await db.collection(config.mongodb.collection).deleteOne({
            _id: new ObjectID(id)
        });
        db.close();
    });

    test('Add send attempt', async () => {
        let id = await mongodb.save(payload);
        await mongodb.send_attempt({id, vendor: 'amazon', timestamp: unixTimestamp()});

        let db = await MongoClient.connect(config.mongodb.url);
        let item = await db.collection(config.mongodb.collection).findOne({
            _id: new ObjectID(id)
        });
        expect(item.attempts.length).toBe(1);
        expect(item.attempts[0].status).toBe('pending');
        await db.collection(config.mongodb.collection).deleteOne({
            _id: new ObjectID(id)
        });
        db.close();
    });

    test('Set attempt to delivered', async () => {
        let id = await mongodb.save(payload);
        await mongodb.send_attempt({id, vendor: 'amazon', timestamp: unixTimestamp()});
        await mongodb.update_attempt({id, status: 'delivered', timestamp: unixTimestamp()});

        let db = await MongoClient.connect(config.mongodb.url);
        let item = await db.collection(config.mongodb.collection).findOne({
            _id: new ObjectID(id)
        });
        expect(item.attempts[0].status).toBe('delivered');
        await db.collection(config.mongodb.collection).deleteOne({
            _id: new ObjectID(id)
        });
        db.close();
    });
});
