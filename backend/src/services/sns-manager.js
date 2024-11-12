import * as AWS from 'aws-sdk';

class SNSTopicSender {
  static client;

  static async sendEmail(topicArn, region, subject, message) {
    this.client = AWS.SNS({
      region,
      // ! Dirty Method, use role and sts instead
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_ACCESS_SECRET_KEY,
    });
    const params = {
      Subject: subject,
      Message: message,
      TopicArn: topicArn,
    };
    const snsPromise = new Promise((resolve, reject) => {
      this.client.publish(params, (error, data) => {
        if (error) {
          reject(error);
        } else {
          resolve(data);
        }
      });
    });
    return snsPromise;
  }
}

const snsTopicSender = new SNSTopicSender();

export { snsTopicSender };
