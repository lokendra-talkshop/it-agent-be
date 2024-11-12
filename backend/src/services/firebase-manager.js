import admin from 'firebase-admin';
import userTokensController from '../controllers/user-tokens-controller';
import { loggerInstance } from '../node-utils';

function isLocalEnvironment() {
  return process.env.ENVIRONMENT === 'local';
}

class FirebaseManager {
  app;

  messaging;

  constructor() {
    if (isLocalEnvironment()) {
      return;
    }

    const serviceAccount = JSON.parse(process.env.FIREBASE_CREDS);
    this.app = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });

    this.messaging = this.app.messaging();
  }

  async triggerNotification(notification) {
    if (isLocalEnvironment()) {
      return;
    }

    const { userId } = notification;
    const userToken = await userTokensController.Read.byUserId(userId);
    if (!userToken || !userToken.fcmToken) {
      return;
    }

    const { fcmToken } = userToken;
    loggerInstance.info('User Token');
    loggerInstance.info(userToken);
    try {
      const r = await this.messaging.send({
        token: fcmToken,
        notification: {
          title: notification.title || undefined,
          body: notification.body,
          imageUrl: notification.primaryThumbnailUrl || undefined,
        },
        data: (() => {
          const data = {};
          if (notification.title) {
            data.title = notification.title;
          }
          if (notification.body) {
            data.body = notification.body;
          }
          if (notification.primaryThumbnailUrl) {
            data.primaryThumbnailUrl = notification.primaryThumbnailUrl;
          }
          if (notification.isActionable) {
            data.isActionable = notification.isActionable.toString();
          }
          if (notification.actionTaken) {
            data.actionTaken = notification.actionTaken;
          }
          if (notification.resourceType) {
            data.resourceType = notification.resourceType;
          }
          if (notification.resourceId) {
            data.resourceId = notification.resourceId;
          }
          if (notification.secondaryResourceId) {
            data.secondaryResourceId = notification.secondaryResourceId;
          }
          if (notification.secondaryResourceType) {
            data.secondaryResourceType = notification.secondaryResourceType;
          }
          return data;
        })(),

        apns: {
          headers: {
            'apns-priority': '10',
          },
          payload: {
            aps: {
              sound: 'default',
            },
          },
        },
      });
      loggerInstance.info('Notification sent successfully', r);
      return r;
    } catch (e) {
      loggerInstance.info('Error sending push notification', e);
    }
  }
}

const firebaseManager = new FirebaseManager();

export default firebaseManager;
