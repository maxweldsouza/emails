import { consumer } from './index';

test('connects to beanstalkd', () => {
    consumer((err, status) => {
        expect(status).toBe('connected');
    })
})
