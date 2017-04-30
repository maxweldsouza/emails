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
			this.send(mail);
		} else {
			// console.log(`Simulated ${this.constructor.name} mail`);
		}
	}
}

export default VendorBase;
