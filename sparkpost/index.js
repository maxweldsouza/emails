import fetch from 'node-fetch';
import * as config from '../config.json';
import VendorBase from '../vendor_base';

class SparkPost extends VendorBase {
	prepare({from, to, text, subject}) {
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
	async send(mail) {
		let body = this.prepare(mail);
		if (process.env.NODE_ENV === 'production') {
			let res = await fetch('https://api.sparkpost.com/api/v1/transmissions?num_rcpt_errors=3', {
				method: 'POST',
				headers: {
					Authorization: config.sparkpost.key
				},
				body
			});
			let json = await res.json();
			return json;
		} else {
			console.log('Simulated sparkpost mail');
			return null;
		}
	}
}

const sparkpost = new SparkPost();
export default sparkpost;