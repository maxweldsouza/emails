import fetch from 'node-fetch';
import config from '../config.json';
import VendorBase from '../vendor_base';

class SendInBlue extends VendorBase {
	prepare({from, to, text, subject}) {
		return {
			from: [from],
			to: {[to]: ''}, // Recipient name
			subject,
			text: text,
			html: text // Mandatory for send in blue
		};
	}
	async send(mail) {
		let body = this.prepare(mail);
		let res = await fetch('https://api.sendinblue.com/v2.0/email', {
			method: 'POST',
			headers: {
				'api-key': config.sendinblue.key
			},
			body
		});
		let json = await res.json();
		return json;
	}
}

export default new SendInBlue();
