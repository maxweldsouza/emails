# Coding Challenge

Problem: E-mail service

Solution: A beanstalkd queue with persistence to mongodb

Features:


Usage:  
To run the consumer
```
node dist/consumer_process.js
```  

To use the producer  
```
import {Producer} from ...  
let producer = new Producer();
await producer.connect();
await producer.send({
    from: 'sender@domain.com',
    to: 'receiver@domain.com',
    subject: 'Email subject',
    text: 'Body of mail'
});
await producer.quit();
```

Technical Choices:
