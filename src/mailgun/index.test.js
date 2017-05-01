import mailgun from './index';

test('Test mailgun request format', () => {
	let result = mailgun.prepare({
		to: 'something@example.com',
		from: 'source@example.com',
		subject: 'Test email',
		text: 'This is the mail body'
	});
	expect(result).toMatchObject({
		to: 'something@example.com',
		from: 'source@example.com',
		subject: 'Test email',
		text: 'This is the mail body'
	});
});
