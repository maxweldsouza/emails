import amazon from './index';

test('Test amazon request format', () => {
	let result = amazon.prepare({
		to: 'something@example.com',
		from: 'source@example.com',
		subject: 'Test email',
		text: 'This is the mail body'
	});
	expect(result).toMatchObject({
		Destination: {
			ToAddresses: ['something@example.com']
		},
		Message: {
			Body: {
				Text: {
					Charset: 'UTF-8',
					Data: 'This is the mail body'
				}
			},
			Subject: {
				Charset: 'UTF-8',
				Data: 'Test email'
			}
		},
		Source: 'source@example.com'
	});
});
