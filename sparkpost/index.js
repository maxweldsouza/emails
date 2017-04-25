import fetch from 'node-fetch';
import * as config from '../config.json';

export function prepare({from, to, text, subject}) {
	return {
		campaign_id: 'postman_inline_both_example',
		recipients: [
			{
				address: to
			}
		],
		content: {
			from: {
				email: from
			},
			subject,
			text
		}
	};
}

export default {
	async send(mail) {
		let body = prepare(mail);
		console.log('Simulated sparkpost mail');

		let res = await fetch('https://api.sparkpost.com/api/v1/transmissions?num_rcpt_errors=3', {
			method: 'POST',
			headers: {
				Authorization: config.sparkpost.key
			},
			body
		});
		let json = await res.json();
		return json;
	}
};
