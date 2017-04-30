import fetch from 'node-fetch';
import config from '../config.json';
import VendorBase from '../vendor_base';

class MailGun extends VendorBase {
	prepare({from, to, text, subject}) {
		return {
			from,
			to,
			subject,
			text
		};
	}
	async send(mail) {
		let body = this.prepare(mail);
		let res = await fetch(`https://api.mailgun.net/v3/${config.mailgun.domain}/messages`, {
			method: 'POST',
			headers: {
				Authorization: `api:${config.mailgun.key}`
			},
			body
		});
		let json = await res.json();
		return json;
	}
}

export default new MailGun();
