import Mail from './mongo';
import {unixTimestamp} from './utils';

describe('Mongodb integration', () => {
    let mail;
    beforeAll(() => {
        mail = new Mail('mongodb://localhost:27017/test');
    })

    test('Save mail to mongodb', async () => {
        let payload = {
            to: 'something@example.com',
            from: 'source@domain.com',
            subject: 'Test subject'
        };
        let id = await mail.save(payload);
        expect(id).toBeTruthy();
    });

    test('Add send attempt', async () => {
        await mail.send_attempt({vendor: 'amazon', timestamp: unixTimestamp()});
    });
});
