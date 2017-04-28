
const _available = Symbol('vendor_availability');

const TEN_MINUTES = 10 * 60 * 1000;

class VendorBase {
	constructor() {
		this[_available] = false;
	}
	get available() {
		return this[_available];
	}
	disableTemporarily() {
		this[_available] = false;
		setTimeout(() => {
			this[_available] = true;
		}, TEN_MINUTES);
	}
}

export default VendorBase;
