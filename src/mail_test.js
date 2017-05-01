import amazon from './amazon';
import mailgun from './mailgun';
import sendinblue from './sendinblue';
import sparkpost from './sparkpost';

let vendor = sendinblue;

console.log(process.env.NODE_ENV);

vendor.send_if_production({
	from: 'mail@mail.comparnion.com',
	to: 'maxellusionist@gmail.com',
	subject: 'Final testing',
	text: 'Hey Maxwel !'
})
.then((value) => {
	console.log('sent');
})
.catch((e) => {
	console.error(e);
});
