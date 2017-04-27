# Coding Challenge

Problem: E-mail service

## Solution:  
A beanstalkd queue with persistence to mongodb.

Persistence:  
When a job is added to a producer it is immediately added to mongodb. Then it is added to the beanstalkd queue. The payload is the id of the object in mongodb. Although beanstalkd has persistence it is good to have the job in mongodb so that data can be looked up easily.

Vendor Selection:  
Vendors are selected using round robin based on the jobid of the beanstalkd job.

Failover:  
If an email service fails it is marked as unavailable for 10 minutes. The failed job is added to the beanstalkd again with higher priority. This means it will be taken up immediately and sent using another vendor.

Features:


## Usage:  
Build `npm build`  
Test `npm t`  

To run the consumer
```
npm run consumer
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
