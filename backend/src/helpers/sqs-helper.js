import { SQSQueueSender } from "../services/sqs-manager";
import appConfig from "../configs";

async function sendMessageToChatAgent({
                                          senderId,
                                          botId,
                                          botConfigId,
                                          threadId,
                                          textInput,
                                          conversationId,
                                          attachments,
                                          toolCallId,
                                          toolOutputs,
                                          runId,
                                          planId
                                          
}) {

    console.log("Creating message")
    const messageToSend = {
        senderId,
        botId,
        botConfigId,
        threadId,
        textInput,
        conversationId,
        conversation_id: conversationId,
        attachments,
        tool_call_id: toolCallId,
        tool_outputs: toolOutputs,
        planId,
        runId,
        webhook: appConfig.baseURL + '/v1/webhook/chat',
        agent_webhook: appConfig.baseURL + '/v1/webhook/tool',
        planner_webhook : appConfig.baseURL + '/v1/webhook/plan',
        memory_webhook : appConfig.baseURL + '/v1/memory/memory'
    }

    const message = await SQSQueueSender.sendMessage(
        appConfig.QUEUES.chat_agent_queue,
        'us-east-2',
        messageToSend
    )

    console.log('Message sent to chat agent: ', JSON.stringify(messageToSend));
    return messageToSend;
}

async function sendMessageToToolAgent({
                                          senderId,
                                          message,
                                          conversationId,
                                          agent,
                                          toolCallId,
                                          runId,
                                          threadId,
                                          planId,
                                          parentId,
                                          queue = appConfig.QUEUES.tool_agent_queue,
}) {
    const messageToSend = {
        senderId,
        message,
        conversationId,
        agent,
        tool_call_id: toolCallId,
        runId,
        threadId,
        planId : planId ? planId : undefined,
        parentId : parentId ? parentId : undefined,
        planner_webhook : appConfig.baseURL + '/v1/webhook/plan',
        webhook: appConfig.baseURL + '/v1/webhook/tool-to-chat',
    }

    await SQSQueueSender.sendMessage(
        queue,
        'us-east-2',
        messageToSend
    )

    console.log('Queue: ', queue)
    console.log('Message sent to tool agent: ', JSON.stringify(messageToSend));
    return messageToSend;
}

export default {
    sendMessageToChatAgent,
    sendMessageToToolAgent,
};