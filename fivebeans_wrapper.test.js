import FiveBeans from './fivebeans_wrapper';

test('Can use async await', async (done) => {
    let fb = new FiveBeans();
    await fb.connect();
    await fb.quit();
    return done();
});

test('Can use promises', () => {
    let fb = new FiveBeans();
    return fb.connect().then(() => {
        return fb.quit();
    });
});

test('Can use tube', async () => {
    let fb = new FiveBeans();
    await fb.connect();
    let tubename = await fb.use('test_fivebeans_wrapper');
    expect(tubename).toBe('test_fivebeans_wrapper');
    await fb.quit();
});

test('Can list tube used', async () => {
    let fb = new FiveBeans();
    await fb.connect();
    await fb.use('test_fivebeans_wrapper');
    let tubename = await fb.list_tube_used();
    expect(tubename).toBe('test_fivebeans_wrapper');
    await fb.quit();
});

test('Can watch tube', async () => {
    let fb = new FiveBeans();
    await fb.connect();
    let tubename = await fb.watch('test_fivebeans_wrapper');
    await fb.quit();
});

describe('Can put and delete jobs', () => {
    let fb = new FiveBeans();
    beforeEach(async () => {
        await fb.connect();
    })
    test('Can put job', async () => {
        let jobid = await fb.put({ priority: 0, delay: 0, payload: { 'hello': 'world' }});
        await fb.delete (jobid);
    });
    afterEach(async () => {
        await fb.quit();
    })
});
