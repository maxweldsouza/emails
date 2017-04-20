import { Producer, Connection } from './index';

test('Connects to beanstalkd', () => {
    let producer = new Producer();
    return producer.connect()
    .then(connection => {
        expect(connection).toBeInstanceOf(Connection);
    })
})

test('Add job to beanstalkd', () => {
    let producer = new Producer();
    return producer.connect()
    .then(connection => {
        return connection.send({ message: 'hello' });
    })
    .then(connection => {
        expect(connection).toBeInstanceOf(Connection);
    })
});
