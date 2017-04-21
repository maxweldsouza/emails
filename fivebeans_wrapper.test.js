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
