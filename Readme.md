# Coding Challenge

## Problem:
E-mail service api

## Solution:  
A beanstalkd queue with persistence to mongodb. Jobs can be added using a producer when adds then to the queue. Producer can be used as an import. One or more consumers process these jobs and send out mails. Consumers can be run independently as processes.

Persistence:  
When a job is added to a producer it's immediately saved to mongodb. Then it's added to the beanstalkd queue. The payload is the id of the object in mongodb. Although beanstalkd has persistence it is good to have the job in mongodb so that data can be looked up easily.

Vendor Selection:  
Vendors are selected using round robin based on the jobid of the beanstalkd job.

Failover:  
If an email service fails it is marked as unavailable for 10 minutes. The failed job is sent using another vendor.

Tests:  
Some tests need mongodb and beanstakld running. Tests are run on a specially named mongodb collection and beanstalkd tube so that they do not interfere with the production environment.

Scalability:  
Multiple consumers can be run as separate processes. This option seems easier to code and maintain. This also seems to [perform better](https://medium.com/@fermads/node-js-process-load-balancing-comparing-cluster-iptables-and-nginx-6746aaf38272).

Dependencies:  
Fivebeans is used since it is well tested and popular. A thin wrapper has been written over fivebeans for use with `async await` syntax. This has led to much cleaner code. This also provides isolation agains api changes in fivebeans.


## Usage:  
### Configuration:
A config.json file in the src directory is required to run. A sample_config.json file has been provided.

### Important Note
Emails will only be sent when NODE_ENV is set to `production` otherwise email sending will only be simulated.

### Running
Clone the git repository. Install dependencies using
```
yarn install
```  
Build the project using
```
npm build
```  
Run a consumer
```
npm run consumer
```  

This could also be run without building using babel-node. However babel-node should not be used in production.

To use the producer  
```javascript
import {Producer} from ...  
let producer = new Producer();

// in async function...
await producer.connect();
await producer.send({
    from: 'sender@domain.com',
    to: 'receiver@domain.com',
    subject: 'Email subject',
    text: 'Body of mail'
});
await producer.quit();
```

## Tests  
Run the unit and integrations tests using
```
npm t
```  

### Load test

To run the load test start one or more consumers using
```
npm run consumer
```

Warning: DON'T run load tests using NODE_ENV=production. Email sending is enabled in production mode.

Start the load test using.
```
npm run loadtest
```

### Measuring throughput
Producers and consumers will display throughput in ops/sec if `measure_throughput` is set to true in the Configuration.

The output will be of the form.
```
Producer PID:8181 Throughput: 625.1059967234404 ops / second
Producer PID:8181 Throughput: 758.5302308360799 ops / second
Producer PID:8181 Throughput: 705.9702588849336 ops / second

```
