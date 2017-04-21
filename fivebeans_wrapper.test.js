import FiveBeans from './fivebeans_wrapper';

test('Can use async await', async (done) => {
    let fb = new FiveBeans();
    let status = await fb.connect();
    expect(status).toBe('connected');
    await fb.quit();
    return done();
});

test('Can use promises', () => {
    let fb = new FiveBeans();
    return fb.connect().then((status) => {
        expect(status).toBe('connected');
        return fb.quit();
    });
});
