import * as AWS from 'aws-sdk';

class SQSQueueSender {
  
  static async sendMessage(queueUrl, region, payload) {
    const client = new AWS.SQS({
      region,
      // ! Dirty Method, use role and sts instead
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_ACCESS_SECRET_KEY,
    });

    const params = {
        'QueueUrl' : queueUrl,
        'MessageBody' : JSON.stringify(payload)  
    };
    const queueResult = new Promise((resolve, reject) => {
      client.sendMessage(params, (error, data) => {
        if (error) {
          reject(error);
        } else {
          resolve(data);
        }
      });
    });
    return queueResult;
  }
}


export {SQSQueueSender};
