import { SQSQueueSender } from '../services/sqs-manager'
import appConfig from '../configs'
import botController from '../controllers/bot-controller'
import conversationController from '../controllers/conversation-controller'
import { S3ObjectReader, UploadFileToS3 } from "../services/s3-media"
import { JsonWebTokenError } from 'jsonwebtoken'
import presignedUrlsController from '../controllers/presigned-urls-controller'
import taskQueueController from '../controllers/task-queue-controller'
import { DynamoDbReader } from '../services/dynamoDB-manager'
import agentController from '../controllers/agent-controller'
import { BadRequestError } from '../node-utils'

export const sendBotGreeting = async (args) => {
    const values = JSON.parse(args)
    const botId = values.botId
    if (!botId) {
        return null
    }
    const bot = await botController.Read.byId(botId)
    const botConfigUrl = bot.configLocation

    const [bucket, key] = botConfigUrl.replace("s3://", "").split("/")

    const configFile = await S3ObjectReader.getObjectData(key, bucket)
    const configData = JSON.parse(configFile)

    return { greeting: configData.greeting, botConfigId: key }
}


export const initiateTask = async (id, args, tokenPayload) => {
    const { id: userId } = tokenPayload
    const values = JSON.parse(args)
    console.log(values)
    if (values.newTask) {

        return await sendCreateTaskMessage(userId, values, id, args)
    } else {
        return await sendBotGreeting(args)
    }
}

export const executeCodeTask = async (id, args, tokenPayload, task) => {
    const values = JSON.parse(args)
    const bot = await botController.Read.byId(values.botId)
    const botConfigId = bot.configLocation.split("/").slice(-1)[0]
    const convoId = values.conversationId
    console.log(task)
    if (task != undefined) {
        if (task.taskType == 'code_execution') {
            const taskData = JSON.parse(task.taskContent)
            await updateState(taskData, values, task.parentNode)
            const topOfQueue = await taskQueueController.Read.peek()
            const conversation = await conversationController.Read.byId({ id: convoId })
            console.log(conversation)


            if (topOfQueue.taskExecution.taskType == "code_execution") {
                const topOfQueueData = JSON.parse(topOfQueue.taskExecution.taskContent)

                if (conversation) {
                    const dbMessage = await conversationController.Update.addMessage({
                        conversationId: conversation.id,
                        text: topOfQueueData.message,
                    })
                    console.log("Inserted dbMessage")
                    const dbMessageId = dbMessage.id


                    return {
                        action: 'sendMessage',
                        message: topOfQueueData.message,
                        messageType: 'user_input',
                        threadId: values.threadId,
                        convoId: conversation.id,
                        messageId: dbMessageId
                    }
                }
            } else {
                const message = "Continue executing plan ?"

                if (conversation) {
                    const dbMessage = await conversationController.Update.addMessage({
                        conversationId: conversation.id,
                        text: message,
                    })
                    console.log("Inserted dbMessage")
                    const dbMessageId = dbMessage.id


                    return {
                        action: 'sendMessage',
                        'message': "Continue executing plan ?",
                        'botConfigId': botConfigId,
                        'threadId': values.threadId,
                        'convoId': conversation.id,
                        messageType: 'confirm_advance_message',
                        'messageId': dbMessageId
                    }
                }
            }

        } else {
            return await generateCode(task, bot, values, id)

        }
    }
}


export const sendModelMessage = async (id, args, tokenPayload) => {
    const values = JSON.parse(args)
    const bot = await botController.Read.byId(values.botId)
    const botConfigId = bot.configLocation.split("/").slice(-1)[0]
    let attachments = values.attachments

    if (attachments) {
        attachments = await Promise.all(attachments.map(async (item) => {
            const attachment = await presignedUrlsController.Read.byId(item)
            return `s3://${attachment.bucket}/${attachment.key}`
        }))

    }

    const messageToSend = {
        'senderId': id,
        'botId': values.botId,
        'botConfigId': botConfigId,
        'threadId': values.threadId,
        'textInput': values.textInput,
        'webhook': appConfig.baseURL + "/v1/chat/message",
        "attachments": attachments ? attachments : []
    }
    console.log(values)
    if (values.hasUserInputRequired || values.is_confirmation) {

        const nextTask = await taskQueueController.Read.dequeue(values.conversationId)
        console.log("Got Task from Queue")
        console.log(nextTask)
        if ((nextTask.taskExecution.taskType == 'code' && !nextTask.taskExecution.isExecuted) || nextTask.taskExecution.taskType == 'code_execution') {
            return executeCodeTask(id, args, tokenPayload, nextTask.taskExecution)
        }
        console.log(nextTask)
        messageToSend.action = 'plan'
        messageToSend.taskData = nextTask.taskExecution.taskContent
        messageToSend.taskType = nextTask.taskExecution.taskType
        messageToSend.depth = nextTask.taskExecution.depth
        messageToSend.taskParentId = nextTask.taskExecution.parentNode ? nextTask.taskExecution.parentNode.parentId : null
        messageToSend.taskId = nextTask.taskExecution.id
    } else if (values.isInput) {
        messageToSend.action = 'task'

    }

    console.log(messageToSend)
    let convoId = values.conversationId
    //TODO : Add the first message to the conversation 
    if (!convoId) {
        const { id: userId } = tokenPayload
        const conversation = await conversationController.Create.new({ userId, botId: values.botId })
        console.log(conversation)

        convoId = conversation.id
        await conversationController.Update.addMessage({
            id: args.messageId,
            userId,
            conversationId: convoId,
            text: values.textInput,
            content: attachments ? JSON.stringify(attachments) : undefined
        })

    }
    messageToSend['convoId'] = convoId

    const message = await SQSQueueSender.sendMessage(
        appConfig.chat_bot_queue,
        'us-east-2',
        messageToSend
    )
    return messageToSend
}

async function sendCreateTaskMessage(userId, values, id, args) {
    const conversation = await conversationController.Create.new({ userId, botId: values.botId })
    const messageToSend = {
        'senderId': id,
        'botId': values.botId,
        'botConfigId': null,
        'threadId': values.threadId,
        'textInput': values.textInput,
        'action': 'task',
        'taskOptions': args.taskInfo,
        'convoId': conversation.id,
        'webhook': appConfig.baseURL + "/v1/chat/message"
    }
    const message = await SQSQueueSender.sendMessage(
        appConfig.chat_bot_queue,
        'us-east-2',
        messageToSend
    )
    return messageToSend
}

export async function generateCode(task, bot, values, id) {
    const taskData = JSON.parse(task.taskContent)
    const reader = new DynamoDbReader(appConfig.aws_region, appConfig.agent_configuration_table)
    console.log(appConfig.agent_configuration_table)
    console.log(process.env.ENVIRONMENT)
    console.log("Getting Tool Information")
    console.log(taskData.tool)
    const config = await reader.getItem({
        service: taskData.tool.toLowerCase()
    })

    const agent = await agentController.Read.byServiceName({ service: taskData.tool.toLowerCase(), botId: bot.id })
    console.log(agent)
    console.log(config)
    const serviceQueue = appConfig.queue_prefix + "/" + config.service_queue

    if (config.save_code_to_s3) {
        const s3Client = new UploadFileToS3(appConfig.aws_region, appConfig.code_save_bucket)
        await s3Client.putFile(taskData.code, values.convoId, config.content_type)
    }

    const messageToSend = {
        senderId: id,
        agentId: agent ? agent.id : undefined,
        code: config.save_code_to_s3 ? `s3://${appConfig.code_save_bucket}/${values.convoId}` : taskData.code,
        convoId: values.conversationId,
        taskId: task.id,
        webhook: appConfig.baseURL + "/v1/chat/execution",
        tool: taskData.tool.toLowerCase()
    }

    const message = await SQSQueueSender.sendMessage(
        serviceQueue,
        'us-east-2',
        messageToSend
    )
    return messageToSend
}

export async function updateState(taskData, values, parentNode) {
    console.log(taskData)
    if (taskData.action == 'fetch_user_data') {
        const textData = values.textInput
        const parentTask = await agentController.Read.taskById({ id: parentNode.parentId })
        let parentTaskState = null;
        if (parentTask.planState == null || parentTask.planState.length > 0) {
            parentTaskState = JSON.parse(parentTask.planState)
        } else {
            parentTaskState = {}
        }
        if (parentTaskState['symbol_table']) {
            parentTaskState['symbol_table'][taskData.variable] = textData
        } else {
            const symbol = taskData.variable
            parentTaskState['symbol_table'] = {
            }
            parentTaskState[symbol] = textData

        }
        await agentController.Update.updateState({ taskId: parentNode.parentId, newState: JSON.stringify(parentTaskState) })
    }
    if (taskData.action == 'update_state') {
        const textData = values.textInput
        const parentTask = await agentController.Read.taskById({ id: parentNode.parentId })
        const parentTaskState = JSON.stringify(parentTask.planState)
        if (parentTaskState.state == undefined) {
            parentTaskState.state = {
                'environment': '',
                'extra_context': []
            }
        }
        console.log(taskData)



    }
}
