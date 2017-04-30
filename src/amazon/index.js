import * as AWS from 'aws-sdk';
import config from '../config.json';
import VendorBase from '../vendor_base';

class Amazon extends VendorBase {
	constructor() {
		super();
		let awsconfig = new AWS.Config();
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
					Html: {
						Charset: 'UTF-8',
						Data: 'This is the message in HTML form.'
					},
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
			ReplyToAddresses: [],
			ReturnPath: '',
			ReturnPathArn: '',
			Source: from,
			SourceArn: ''
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
		})
	}
}

const amazon = new Amazon();
export default amazon;
