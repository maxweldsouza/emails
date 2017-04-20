import { consumer } from './index';

test('connects to beanstalkd', () => {
    consumer().then(status => {
        expect(status).toEqual('connected');
    })
})
