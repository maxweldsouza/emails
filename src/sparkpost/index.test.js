import sparkpost from './index';

test('Test sparkpost request format', () => {
	let result = sparkpost.prepare({
		to: 'something@example.com',
		from: 'source@example.com',
		subject: 'Test email',
		text: 'This is the mail body'
	});
	expect(result).toMatchObject({
		campaign_id: 'postman_inline_both_example',
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
