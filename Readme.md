# Coding Challenge

## Problem:
E-mail service api

## Solution:  
A beanstalkd queue with persistence to mongodb. It consists of a producer and a consumer. The producer is an npm package that can be imported. The consumer can be run directly as a process. Multiple producers and consumers can be run simultaneously. Jobs are added using a producer which adds then to the queue. Consumers process these jobs and send out mails.

Persistence:  
When a job is added to a producer it's immediately saved to mongodb. Then it's added to the queue. Only the id of the mongodb object is added to the queue. Although beanstalkd has persistence it is good to have the job in mongodb so that data can be looked up easily.

Vendor Selection:  
Vendors are selected using round robin based on the jobid of the beanstalkd job.

Failover:  
If an email service fails it is marked as unavailable for 10 minutes. The failed job is sent using another vendor.

Tests:  
Some tests need mongodb and beanstakld running. Tests are run on a specially named mongodb collection and beanstalkd tube so that they do not interfere with the production environment.

Scalability:  
Multiple consumers can be run as separate processes. This option seems easier to code and maintain. This also seems to [perform better](https://medium.com/@fermads/node-js-process-load-balancing-comparing-cluster-iptables-and-nginx-6746aaf38272). These processes can be managed using forever or pm2.

Dependencies:  
Fivebeans is used since it is well tested and popular. A thin wrapper has been written over fivebeans for use with `async await` syntax. This has led to much cleaner code. This also provides isolation agains api changes in fivebeans.


## Usage:  
### Configuration:
A config.json file in the src directory is required to run. A sample_config.json file has been provided.
```json
{
    "measure_throughput": true,
    "test": {
        "beanstalkd": {
            "hostname": "127.0.0.1",
            "port": 11300,
            "tube": "test_integration"
        },
        "mongodb": {
            "uri": "mongodb://localhost:27017/test",
            "collection": "test_mails"
        }
    },
    "beanstalkd": {
        "hostname": "127.0.0.1",
        "port": 11300,
        "tube": "email_queue"
    },
    "mongodb": {
        "uri": "mongodb://localhost:27017/dbname",
        "collection": "emails"
    },
    "amazon": {
        "region": "us-east-1",
        "credentials": {
            "accessKeyId": "",
            "secretAccessKey": ""
        }
    },
    "mailgun": {
        "domain": "",
        "key": ""
    },
    "sendinblue": {
        "key": ""
    },
    "sparkpost": {
        "key": ""
    }
}
```

### Important Note
> Emails will only be sent when NODE_ENV is set to `production` otherwise email sending will only be simulated.

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

### Load test
> Warning: DON'T run load tests using NODE_ENV=production. Email sending is enabled in production mode.

The load test will add several (10k) jobs to the queue. To run the load test start one or more consumers using
```
npm run consumer --test
```
The test flag will ensure that the consumer uses the same tube and database collection that the load testing script uses.

Start the load test using.
```
npm run loadtest
```

## Tests  
Run the unit and integrations tests using
```
npm t
```  

### Measuring throughput
Producers and consumers will display throughput in ops/sec if `measure_throughput` is set to true in the Configuration.

The output will be of the form.
```
Producer PID:8181 Throughput: 625.1059967234404 ops / second
Producer PID:8181 Throughput: 758.5302308360799 ops / second
Producer PID:8181 Throughput: 705.9702588849336 ops / second

```
