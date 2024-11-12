import { v4 as uuid4 } from 'uuid';
import { prisma } from '../db/prisma-manager';
import { loggerInstance } from '../node-utils';
import { DeleteObjects, PresignedTransfers } from '../services/s3-media';
import appConfig from '../configs';

class Create {

  static async newUserAttachment(userId, contentType = null) {
    const suffix = contentType != null ? `.${contentType.split('/')[1]}` : '';
    const key = `${Date.now()}${suffix}`;
    const response = await PresignedTransfers.generatePresignedPutUrl(key, contentType , appConfig.attachment_bucket);
    return prisma.writeClient.presignedURLs.create({
      data: {
        user: userId,
        key,
        url: response.signedUrl,
        bucket: response.bucket,
        contentType,
      },
    });
     }

  static async newUserImage(userId, contentType = null) {
    const suffix = contentType != null ? `.${contentType.split('/')[1]}` : '';
    const key = `user-profile-images/${Date.now()}${suffix}`;
    const response = await PresignedTransfers.generatePresignedPutUrl(key, contentType);
    return prisma.writeClient.presignedURLs.create({
      data: {
        user: userId,
        key,
        url: response.signedUrl,
        bucket: response.bucket,
        contentType,
      },
    });
     }
     static async newBotImage(userId, contentType = null) {
      const suffix = contentType != null ? `.${contentType.split('/')[1]}` : '';
      const key = `bot-images/${Date.now()}${suffix}`;
      console.log(`Creating user image ${key}`)
      const response = await PresignedTransfers.generatePresignedPutUrl(key, contentType);
      return prisma.writeClient.presignedURLs.create({
        data: {
          user: userId,
          key,
          url: response.signedUrl,
          bucket: response.bucket,
          contentType,
        },
      });
       }
  
  }


class Read {
  static getPublicDistributionURL(presignedURL) {
    const distribution = `https://${appConfig.user_images_distribution}.cloudfront.net`;
    const { userBucket } = appConfig;
    loggerInstance.info(userBucket);
    if (presignedURL.bucket === userBucket) {
      return `${distribution}/${presignedURL.key}`;
    }
    return `https://${presignedURL.bucket}.s3.amazonaws.com/${presignedURL.key}`;
  }

  static async byUserAndId(id, userId) {
    return prisma.readClient.presignedURLs.findUnique({
      where: { id, user: userId },
    });
  }

  static async byId(id) {
    return prisma.readClient.presignedURLs.findUnique({
      where: { id },
    });
  }

  static async byUserIdAndKeyPrefix({ userId, key }) {
    return prisma.readClient.presignedURLs.findFirst({
      where: {
        user: userId,
        key: {
          startsWith: key,
        },
      },
    });
  }
}

class Delete {
  static async byUserIdAndKey({ userId, key }) {
    try {
      const presignedURL = await Read.byUserIdAndKeyPrefix({ userId, key });

      if (!presignedURL) {
        loggerInstance.info('No video url exists for this post', key);
        return;
      }

      await Promise.all([
        prisma.writeClient.presignedURLs.delete({
          where: {
            id: presignedURL.id,
          },
        }),

        DeleteObjects.deleteFromS3({
          key: presignedURL.key,
          bucket: appConfig.user_images_bucket,
          region: 'us-east-2',
        }),
      ]);
    } catch (error) {
      loggerInstance.error('Error deleting user video:', error);
      throw error;
    }
  }
}

export default { Create, Read, Delete };
