import {save, send_attempt, _danger_clear_collection} from './mongo';
import {unixTimestamp} from './utils';

test('Save mail to mongodb', async () => {
	let payload = {
		to: 'something@example.com',
		from: 'source@domain.com',
		subject: 'Test subject'
	};
	await save(payload);
    await _danger_clear_collection();
});

test('Add send attempt', async () => {
	await send_attempt({vendor: 'amazon', timestamp: unixTimestamp()});
});
