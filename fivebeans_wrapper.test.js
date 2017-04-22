import FiveBeans from './fivebeans_wrapper';


test('Can use async await', async () => {
    let fb = new FiveBeans();
    await fb.connect();
    await fb.quit();
});

test('Can use promises', () => {
    let fb = new FiveBeans();
    return fb.connect().then(() => {
        return fb.quit();
    });
});

test('Clear tube deletes all ready jobs', async () => {
    let fb = new FiveBeans();
    try {
        await fb.connect();
        await fb.put({priority: 0, delay: 0, payload: {hello: 'world'}});
        await fb._danger_clear_tube();
        await fb.peek_ready();
        await fb.quit();
    } catch (e) {
        expect(e).toEqual('NOT_FOUND');
    }
});

describe('Beanstalkd tests', () => {
    let fb;
    beforeEach(async () => {
        await fb._danger_clear_tube();
    });

    beforeAll(async () => {
        fb = new FiveBeans();
        await fb.connect();
    })

    test('Can use tube', async () => {
        let tubename = await fb.use('test_fivebeans_wrapper');
        expect(tubename).toBe('test_fivebeans_wrapper');
    });

    test('Can list tube used', async () => {
        await fb.use('test_fivebeans_wrapper');
        let tubename = await fb.list_tube_used();
        expect(tubename).toBe('test_fivebeans_wrapper');
    });

    test('Can watch tube', async () => {
        let tubename = await fb.watch('test_fivebeans_wrapper');
    });

    test('Can reserve job', async () => {
        await fb.put({priority: 0, delay: 0, payload: {hello: 'world'}});
        let result = await fb.reserve();
        expect(result.payload).toMatchObject({hello: 'world'});
    });

    test('Can put job', async () => {
        let jobid = await fb.put({priority: 0, delay: 0, payload: {hello: 'world'}});
        await fb.delete(jobid);
    });

    afterAll(async () => {
        await fb.quit();
    })
});
