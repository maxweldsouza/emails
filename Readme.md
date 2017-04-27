# Coding Challenge

## Problem:
E-mail service api

## Solution:  
A beanstalkd queue with persistence to mongodb.

Persistence:  
When a job is added to a producer it is immediately added to mongodb. Then it is added to the beanstalkd queue. The payload is the id of the object in mongodb. Although beanstalkd has persistence it is good to have the job in mongodb so that data can be looked up easily.

Vendor Selection:  
Vendors are selected using round robin based on the jobid of the beanstalkd job.

Failover:  
If an email service fails it is marked as unavailable for 10 minutes. The failed job is added to the beanstalkd again with higher priority. This means it will be taken up immediately and sent using another vendor.

Tests:  
Some tests need mongodb and beanstakld running. Tests are run on a specially named mongodb collection and beanstalkd tube so that they do not interfere with the production environment.

Scalability:  
Multiple consumers can be run as separate processes. This option seems easier to code and maintain. This also seems to [perform better](https://medium.com/@fermads/node-js-process-load-balancing-comparing-cluster-iptables-and-nginx-6746aaf38272). Node's Cluster requires additional code and there is no shared memory between processes.

Dependencies:
Fivebeans has been selected since it is well tested and popular. A thin wrapper has been written over fivebeans for use with `async await` syntax. This has led to much cleaner code. This also provides isolation agains api changes in fivebeans.


## Usage:  
Configuration:
A config.json file is required to run. A sample_config.json file has been provided.

### Important Note
```
Emails will only be sent when NODE_ENV is set to production otherwise email sending will only be simulated.
```

Build  
```
npm build
```  

Test  
```
npm t
```  

To run the consumer
```
npm run consumer
```  

To use the producer  
```javascript
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
