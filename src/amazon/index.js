import * as AWS from 'aws-sdk';
import config from '../config.json';
import VendorBase from '../vendor_base';

class Amazon extends VendorBase {
	constructor() {
		super();

		/* eslint-disable no-unused-vars */
		let awsconfig = new AWS.Config();
		/* eslint-enable no-unused-vars */

		AWS.config.update(config.amazon);
		this.ses = new AWS.SES({apiVersion: '2010-12-01'});
	}
	prepare({from, to, text, subject}) {
		return {
			Destination: {
				ToAddresses: [to]
			},
			Message: {
				Body: {
					Text: {
						Charset: 'UTF-8',
						Data: text
					}
				},
				Subject: {
					Charset: 'UTF-8',
					Data: subject
				}
			},
			Source: from
		};
	}
	send(mail) {
		let params = this.prepare(mail);
		return new Promise((resolve, reject) => {
			this.ses.sendEmail(params, function (e, data) {
				if (e) {
					reject(e);
				} else {
					resolve(data);
				}
			});
		});
	}
}

const amazon = new Amazon();
export default amazon;
