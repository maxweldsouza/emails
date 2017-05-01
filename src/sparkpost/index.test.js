import sparkpost from './index';

test('Test sparkpost request format', () => {
	let result = sparkpost.prepare({
		to: 'something@example.com',
		from: 'source@example.com',
		subject: 'Test email',
		text: 'This is the mail body'
	});
	expect(result).toMatchObject({
		recipients: [
			{
				address: 'something@example.com'
			}
		],
		content: {
			from: {
				email: 'source@example.com'
			},
			subject: 'Test email',
			text: 'This is the mail body'
		}
	});
});
