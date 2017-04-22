import { prepare } from './index';

test('Test amazon request format', () => {
    let result = prepare({
        to: 'something@example.com',
        from: 'source@example.com',
        subject: 'Test email',
        text: 'This is the mail body'
    });
    expect(result).toEqual({
        Destination: {
            ToAddresses: ['something@example.com']
        },
        Message: {
            Body: {
                Html: {
                    Charset: 'UTF-8',
                    Data: 'This is the message in HTML form.',
                },
                Text: {
                    Charset: 'UTF-8',
                    Data: 'This is the mail body',
                },
            },
            Subject: {
                Charset: 'UTF-8',
                Data: 'Test email',
            },
        },
        ReplyToAddresses: [],
        ReturnPath: '',
        ReturnPathArn: '',
        Source: 'source@example.com',
        SourceArn: '',
    })
});
