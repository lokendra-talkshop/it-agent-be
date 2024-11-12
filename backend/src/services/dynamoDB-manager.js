import { DynamoDB } from 'aws-sdk';
import { loggerInstance } from '../node-utils';

export class DynamoDbReader {
  constructor(region, tableName) {
    this.dynamoClient = new DynamoDB.DocumentClient({
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_ACCESS_SECRET_KEY,
      region,
    });
    this.tableName = tableName;
  }

  async scanItems() {
    const params = { TableName: this.tableName };
    return new Promise((resolve, reject) => {
      this.dynamoClient.scan(params, (error, data) => {
        if (!error) {
          resolve(data);
        } else {
          reject(error);
        }
      });
    });
  }

  async getItem(key) {
    const params = { TableName: this.tableName, Key: key };
    console.log(params)
    const result = await new Promise((resolve, reject) => {
      this.dynamoClient.get(params, (error, data) => {
        if (!error) {
          resolve(data.Item);
        } else {
          reject(error);
        }
      });
    });
    return result;
  }
}

export class DynamoDBWriter {
  dynamoClient;

  tableName;

  constructor(region, tableName) {
    this.dynamoClient = new DynamoDB.DocumentClient({
      region,
      // ! Dirty Method, use role and sts instead
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_ACCESS_SECRET_KEY,
    });
    this.tableName = tableName;
  }

  async putItem(item, condition = null) {
    const params = {
      TableName: this.tableName,
      Item: item,
    };
    if (condition) {
      params.ConditionExpression = condition;
    }

    try {
      loggerInstance.info('DynamoDBWriter.putItem', params);
      return this.dynamoClient.put(params).promise();
    } catch (error) {
      loggerInstance.error('Error putting item:', error);
      throw error;
    }
  }
}
