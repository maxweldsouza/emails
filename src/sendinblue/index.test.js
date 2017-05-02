import sendinblue from './index';

test('Test sendinblue request format', () => {
	let result = sendinblue.prepare({
		to: 'something@example.com',
		from: 'source@example.com',
		subject: 'Test email',
		text: 'This is the mail body'
	});
	expect(result).toMatchObject({
		from: ['source@example.com'],
		to: {'something@example.com': ''}, // Recipient name
		subject: 'Test email',
		html: 'This is the mail body',
		text: 'This is the mail body'
	});
});
