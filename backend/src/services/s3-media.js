import * as AWS from 'aws-sdk';
import { loggerInstance } from '../node-utils';
import appConfig from '../configs';

class S3ObjectReader {
  static s3Client;

  static getBucket() {
    return appConfig.user_images_bucket
  }

  static get client() {
    if (this.s3Client) {
      return this.s3Client;
    }
    this.s3Client = new AWS.S3({
      region: 'us-east-2',
      // ! Dirty Method, use role and sts instead
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_ACCESS_SECRET_KEY,
    });
    return this.s3Client;
  }

  static async listObjects(bucket, prefix) {
    const params = {
      Bucket: bucket,
      Prefix: prefix,
    };
    return new Promise((resolve) => {
      this.client.listObjects(params, (err, data) => {
        if (err) {
          resolve(null);
        } else {
          if (data.Contents) {
            resolve(data.Contents);
          }
          resolve(null);
        }
      });
    });
  }

  static async getObjectData(key, bucket = null) {
    bucket = bucket || this.getBucket();
    const params = {
      Bucket: bucket,
      Key: key,
    };
    const fetchDataPromise = new Promise((resolve) => {
      this.client.getObject(params, (err, data) => {
        if (err) {
          resolve(null);
        } else {
          if (data.Body) {
            resolve(data.Body);
          }
          resolve(null);
        }
      });
    });
    const resp = await fetchDataPromise;
    if (resp == null) {
      return null;
    }
    return resp;
  }
}

class DeleteObjects {
  static async deleteFromS3({ key, bucket = null, region = null }) {
    const s3 = new AWS.S3({
      region,
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_ACCESS_SECRET_KEY,
    });

    try {
      await s3
        .deleteObject({
          Bucket: bucket,
          Key: key,
        })
        .promise();
    } catch (error) {
      loggerInstance.error('Error while deleting from S3:', error);
      throw error;
    }
  }
}

class PresignedTransfers {
  static s3Client;

  static getBucket() {
    return appConfig.user_images_bucket 
   }

  static get client() {
    if (this.s3Client) {
      return this.s3Client;
    }
    this.s3Client = new AWS.S3({
      region: 'us-east-2',
      // ! Dirty Method, use role and sts instead
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_ACCESS_SECRET_KEY,
    });
    return this.s3Client;
  }

  static async generatePresignedPutUrl(key, contentType = null, bucket = null, region = null) {
    let { client } = this;
    if (region != null && region !== 'us-east-2') {
      client = new AWS.S3({
        region,
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_ACCESS_SECRET_KEY,
      });
    }
    bucket = bucket || this.getBucket();
    const params = {
      Bucket: bucket,
      Key: key,
      Expires: 60 * 60, // 60 mins
    };

    if (contentType != null) {
      params.ContentType = contentType;
    }

    try {
      const url = await client.getSignedUrlPromise('putObject', params);
      return { signedUrl: url, bucket };
    } catch (error) {
      loggerInstance.error('Error generating pre-signed URL:', error);
      throw error;
    }
  }
}

class UploadFileToS3 {
  s3Client;

  bucket;

  keyPrefix;

  constructor(region, bucket, keyPrefix = null) {
    this.s3Client = new AWS.S3({
      region,
      // ! Dirty Method, use role and sts instead
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_ACCESS_SECRET_KEY,
    });
    this.bucket = bucket;
    this.keyPrefix = keyPrefix != null && keyPrefix.length ? `${keyPrefix}/` : '';
  }

  async putFile(fileContents, fileName, contentType, encoder) {
    const params = {
      Bucket: this.bucket,
      Key: this.keyPrefix ? `${this.keyPrefix}${fileName}` : fileName,
      Body: encoder ? encoder(fileContents) : fileContents,
      ContentType: contentType,
    };
    try {
      loggerInstance.info('UploadFileToS3.putFile', params);
      const data = await this.s3Client.putObject(params).promise();
      loggerInstance.info(`File uploaded successfully. ETag: ${data.ETag} `);
      return data;
    } catch (error) {
      loggerInstance.error('Error uploading file:', error);
      throw error;
    }
  }
}

export { PresignedTransfers, S3ObjectReader, DeleteObjects, UploadFileToS3 };
