import {Producer} from './index';

describe('Beanstalkd integration', () => {
	let producer;
	let connection;
	let options = {
		hostname: '127.0.0.1',
		port: 11300,
		tube: 'test_integration'
	};

	beforeAll(() => {
		producer = new Producer(options);
		return producer.connect();
	});

	test('Connects to beanstalkd', () => {
		return expect(producer).toBeInstanceOf(Producer);
	});

	test('Correct tube used', () => {
		producer._tubename().then(tubename => {
			expect(tubename).toBe(options.tube);
		});
	});

	test('Add job to beanstalkd', () => {
		return producer.send({message: 'hello'}).then(connection => {
			expect(connection).toBeInstanceOf(Producer);
		});
	});

	test('Receive job from beanstalkd', () => {
		// let message = {message: 'hello'};
		// return connection.send(message)
		// .then(conn => {
		//     return conn.recieve();
		// })
		// .then(payload => {
		//     expect(payload).toEqual(message);
		// })
	});

	afterAll(done => {
		producer._delete_all_ready(() => {
			producer.quit().then(() => {
				done();
			});
		});
	});
});
