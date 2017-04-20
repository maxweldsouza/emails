import {Producer, Consumer} from './index';

describe('Beanstalkd integration', () => {
	let producer;
	let consumer;
	let connection;
	let options = {
		hostname: '127.0.0.1',
		port: 11300,
		tube: 'test_integration'
	};

	beforeAll(() => {
		producer = new Producer(options);
        consumer = new Consumer(options);
		return producer.connect()
            .then(() => {
                return consumer.connect();
            });
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
		let message = {message: 'hello'};
		return producer.send(message)
		.then(() => {
		    return consumer.recieve();
		})
		.then(buffer => {
            let result = JSON.parse(buffer.toString('ascii'));
		    expect(result).toEqual(message);
		})
	});

	afterAll(done => {
		producer._delete_all_ready(() => {
			producer.quit().then(() => {
				done();
			});
		});
	});
});
