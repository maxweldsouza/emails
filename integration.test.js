import { Producer, Connection } from './index';

test('connects to beanstalkd', () => {
    let producer = new Producer();
    return producer.connect()
    .then(status => {
        expect(status).toBeInstanceOf(Connection);
    })
})
