import FiveBeans from './fivebeans_wrapper';
import * as config from './config.json';

test('Can use async await', async () => {
	let fivebeans = new FiveBeans();
	await fivebeans.connect();
	await fivebeans.quit();
});

test('Can use promises', () => {
	let fivebeans = new FiveBeans();
	return fivebeans.connect().then(() => {
		return fivebeans.quit();
	});
});

test('Clear tube deletes all ready jobs', async () => {
	let fivebeans = new FiveBeans();
	try {
		await fivebeans.connect();
		await fivebeans.put({priority: 0, delay: 0, payload: {hello: 'world'}});
		await fivebeans.put({priority: 0, delay: 0, payload: {hello: 'world'}});
		await fivebeans.put({priority: 1, delay: 0, payload: {hello: 'world'}});
		await fivebeans.put({priority: 1, delay: 0, payload: {hello: 'world'}});
		await fivebeans._danger_clear_tube();
		await fivebeans.peek_ready();
		await fivebeans.quit();
	} catch (e) {
		expect(e).toEqual('NOT_FOUND');
	}
});

describe('Beanstalkd tests', () => {
	let fivebeans;
	beforeEach(async () => {
		await fivebeans._danger_clear_tube();
		await fivebeans.use(config.beanstalkd.tube);
		await fivebeans.watch(config.beanstalkd.tube);
	});

	beforeAll(async () => {
		fivebeans = new FiveBeans();
		await fivebeans.connect();
	});

	test('Can list tube used', async () => {
		let tubename = await fivebeans.list_tube_used();
		expect(tubename).toBe(config.beanstalkd.tube);
	});


	test('Can reserve job', async () => {
		await fivebeans.put({priority: 0, delay: 0, payload: {hello: 'world'}});
		let result = await fivebeans.reserve();
		expect(result.payload).toMatchObject({hello: 'world'});
	});

	test('Can put job', async () => {
		let jobid = await fivebeans.put({priority: 0, delay: 0, payload: {hello: 'world'}});
		await fivebeans.delete(jobid);
	});

	afterAll(async () => {
		await fivebeans.quit();
	});
});
