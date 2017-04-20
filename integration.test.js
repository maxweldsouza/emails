import {Producer, Connection} from './index';

describe('Beanstalkd integration', () => {
	let options = {hostname: '127.0.0.1', port: 11300};
	test('Connects to beanstalkd', () => {
		let producer = new Producer(options);
		return producer.connect().then(connection => {
			expect(connection).toBeInstanceOf(Connection);
		});
	});

	test('Add job to beanstalkd', () => {
		let producer = new Producer(options);
		return producer
			.connect()
			.then(connection => {
				return connection.send({message: 'hello'});
			})
			.then(connection => {
				expect(connection).toBeInstanceOf(Connection);
			});
	});
});
