const _available = Symbol('vendor_availability');

const TEN_MINUTES_MS = 10 * 60 * 1000;

class VendorBase {
	constructor() {
		this[_available] = true;
	}
	get available() {
		return this[_available];
	}
	disableTemporarily() {
		this[_available] = false;
		setTimeout(() => {
			this[_available] = true;
		}, TEN_MINUTES_MS);
	}
	async send_if_production(mail) {
		if (process.env.NODE_ENV === 'production') {
			return this.send(mail);
		} else {
			// Simulate long network request to make sure jobs are processed asynchronously
			return new Promise((resolve, reject) => {
				setTimeout(() => {
					resolve();
				}, 200);
			});
		}
	}
}

export default VendorBase;
