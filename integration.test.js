import {Producer, Connection} from './index';

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
        return producer.connect().then(conn => {
            connection = conn;
        });
    });

    test('Connects to beanstalkd', () => {
		return expect(connection).toBeInstanceOf(Connection);
	});

    test('Correct tube used', () => {
        connection._tubename()
        .then(tubename => {
            expect(tubename).toBe(options.tube);
        });
    });

	test('Add job to beanstalkd', () => {
		return connection.send({message: 'hello'})
    		.then(connection => {
    			expect(connection).toBeInstanceOf(Connection);
    		});
	});

    afterAll(done => {
        connection._delete_all_ready(() => {
            connection.quit().then(() => {
                done();
            });
        });
    });
});
