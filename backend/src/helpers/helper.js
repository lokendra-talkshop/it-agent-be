import botController from "../controllers/bot-controller";
import conversationController from "../controllers/conversation-controller";
import formatter from "./formatter";
import sqsHelper from "./sqs-helper";
import presignedUrlsController from "../controllers/presigned-urls-controller";

async function sendBotGreeting({ payload }) {
    const botId = payload.botId;
    if (!botId) {
        return null;
    }

    const bot = await botController.Read.byId(botId);
    if (!bot) {
        return null;
    }

    console.log(bot);
    const { key, configData } = await formatter.getBotConfigDataFromUrl(bot.configLocation);

    return { greeting: configData.greeting, botConfigId: key };
}

async function sendModelMessage({ socketId, userId, payload }) {
    const bot = await botController.Read.byId(payload.botId);
    const botConfigId = bot.configLocation.split('/').pop();

    const conversationId = await getConversationId({ userId, payload })
    const attachments = await uploadAttachmentsIfAny(payload.attachments);

    const messageToSend = {
        senderId: socketId,
        botId: bot.id,
        botConfigId,
        threadId: payload.threadId,
        textInput: payload.textInput,
        conversationId,
        attachments
    }

    console.log('Sending message to chat agent', messageToSend);
    await sqsHelper.sendMessageToChatAgent({ ...messageToSend });
    return messageToSend;
}

async function uploadAttachmentsIfAny({ attachments = [] }) {
    return Promise.all(attachments.map(async (item) => {
        const attachment = await presignedUrlsController.Read.byId(item)
        return `s3://${attachment.bucket}/${attachment.key}`
    }));
}

async function getConversationId({ userId, payload }) {
    if (payload.conversationId) {
        return payload.conversationId;
    }

    const conversation = await conversationController.Create.new({ userId, botId: payload.botId });
    await conversationController.Update.addMessage({
        id: payload.messageId,
        userId,
        conversationId: conversation.id,
        text: payload.textInput,
    })
    return conversation.id;
}

export default {
    sendBotGreeting,
    sendModelMessage,
};