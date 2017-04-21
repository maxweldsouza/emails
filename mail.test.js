import { validate } from './mail';

test('Validate payload', () => {
    expect(validate({})).toBe(false);
    expect(validate({
        to: 'something@example.com',
    })).toBe(false);
    expect(validate({
        to: 'something@example.com',
        from: 'source@domain.com',
        subject: 'Test subject'
    })).toBe(true);
});
