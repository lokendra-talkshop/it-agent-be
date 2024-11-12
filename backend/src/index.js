import { loggerInstance, NotAuthorizedError, RoleAuthenticators, UserTypes } from './node-utils/index';
import { app, expressOasGenerator } from './app';
import { redis } from './db/redis-manager';
import { Server } from "socket.io";
import {sendBotGreeting, sendModelMessage, initiateTask} from "./helpers/send-message-helper"
import { prisma } from './db/prisma-manager';
import {v4 as uuid4} from 'uuid'
import helper from "./helpers/helper";

loggerInstance.initialize('users', 'debug');

const start = async () => {
  try {
    // * Check for env variables
    [
      'POSTGRES_USER',
      'POSTGRES_PASSWORD',
      'POSTGRES_DB',
      'POSTGRES_READ_URL',
      'POSTGRES_WRITE_URL',
      'REDIS_URL',
      'IS_TOKEN_ENCRYPTED',
      'ENVIRONMENT',
      'AWS_ACCESS_KEY_ID',
      'AWS_ACCESS_SECRET_KEY',
      'CRYPTO_KEY',
      'JWT_SECRET',
      'REFRESH_SECRET',
      'GOOGLE_CLIENT_ID',
    ].forEach((key) => {
      if (!process.env[key]) {
        throw new Error(`Environment variable ${key} must be defined before starting the server.`);
      }
    });
    loggerInstance.info('Starting Database Connection');
    // * Connect to database
    // * Connect to database
    await prisma.connect();

    loggerInstance.info('Connecting to Redis');
    await redis.createConnection(process.env.REDIS_URL);
    loggerInstance.info('Created Redis Connection');
    loggerInstance.info('Finished Configuration');

    let hasShutdown = false;
    process.on('SIGINT', async () => {
      await prisma.disconnect();
      hasShutdown = true;
      process.exit(0);
    });
    process.on('SIGTERM', async () => {
      if (hasShutdown) {
        return;
      }
      hasShutdown = true;
      process.exit(0);
    });

    expressOasGenerator.handleRequests();

    const server = app.listen(3000, () => {
      loggerInstance.info('Listening on port 3000!');
    });

    console.log("Setting up io")
    const io = new Server(server,  {
      cors : {
       origin: "*"
    }})
    app.set('socket.io', io)

    io.on("connection", (socket ,args) => {
        const authenticator = new RoleAuthenticators([{type : UserTypes.user}])
        authenticate(socket, authenticator);
        console.log("A user has connected")

        socket.on("initiate_convo", async (args) => {
            console.log("===========Initiating conversation")
            const userId = getUserIdOrDisconnect(socket, authenticator);
            console.log(userId);
            try {
                const payload = JSON.parse(args);
                console.log(payload);
                const response = await helper.sendBotGreeting({ socketId: socket.id, userId, payload });
                loggerInstance.info("Task Initiated -" + JSON.stringify(response));
                if (response?.greeting) {
                    socket.emit("chat_message", JSON.stringify({
                        'message': response.greeting,
                        'botConfigId': response.botConfigId,
                        'messageId': uuid4()
                    }));
                }
            } catch (error) {
                loggerInstance.error("Error initiating conversation: " + JSON.stringify(error));
            }
        });

        socket.on("chat_message", async (args) => {
            console.log("===========Chat message")
            const userId = getUserIdOrDisconnect(socket, authenticator);
            console.log(userId);
            try {
                const payload = JSON.parse(args);
                const response = await helper.sendModelMessage({ socketId: socket.id, userId, payload });
                console.log("==== Response");
                console.log(response);
                loggerInstance.info("User Message recieved -" + JSON.stringify(response))
                if (response?.action === 'sendMessage') {
                    socket.emit(response.messageType, JSON.stringify({
                        'message': response.message,
                        'botConfigId': response.botConfigId,
                        'threadId': response.threadId,
                        'messageId': response.messageId,
                        'convoId': response.conversationId,
                    }))
                }
            } catch (error) {
                loggerInstance.error("Error sending chat message task: " + JSON.stringify(error));
            }
        })
    })
  
    app.set('socketio', io); 
        
  } catch (error) {
    loggerInstance.error(error);
  }
};

start();

function getUserIdOrDisconnect(socket, authenticator) {
    const jwtToken = authenticate(socket, authenticator);
    if (!jwtToken) {
        return null;
    }
    const { id: userId } = jwtToken;
    return userId;
}

function authenticate(socket, authenticator) {
    const bearerToken = socket.handshake.headers.authorization;
    if (bearerToken) {
        const authToken = bearerToken.split(" ").slice(-1)[0];
        console.log(authToken);
        try {
            const { isAllowed, jwtToken } = authenticator.authenticate(authToken);
            if (!isAllowed) {
                socket.disconnect();
            }
            return jwtToken
        } catch (error) {
            socket.disconnect();
        }
    } else {
        socket.disconnect();
    }
    return null
}
