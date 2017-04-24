import * as AWS from 'aws-sdk';
let ses = new AWS.SES({apiVersion: '2010-12-01'});

export function prepare({ from, to, text, subject }) {
    return {
        Destination: {
            ToAddresses: [to]
        },
        Message: {
            Body: {
                Html: {
                    Charset: 'UTF-8',
                    Data: 'This is the message in HTML form.',
                },
                Text: {
                    Charset: 'UTF-8',
                    Data: text,
                },
            },
            Subject: {
                Charset: 'UTF-8',
                Data: subject,
            },
        },
        ReplyToAddresses: [],
        ReturnPath: '',
        ReturnPathArn: '',
        Source: from,
        SourceArn: '',
    };
}

export default {
    async send(mail) {
        let params = prepare(mail);
        console.log('Simulated amazon mail');
        // ses.sendEmail(params, function(err, data) {
        //     if (err) {
        //         console.log(err, err.stack);
        //     } else {
        //         console.log(data);
        //     }
        // });
    }
}
