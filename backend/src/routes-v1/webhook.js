import { Router } from "express";
import { body } from "express-validator";

import { BadRequestError, validateRequest } from "../node-utils";
import conversationController from "../controllers/conversation-controller";
import sqsHelper from "../helpers/sqs-helper";
import formatter from "../helpers/formatter";
import dynamoHelper from "../helpers/dynamo-helper";
import { IoTFleetHub, Route53Resolver } from "aws-sdk";
import { json } from "body-parser";
import taskQueueController from "../controllers/task-queue-controller";
import agentController from "../controllers/agent-controller";
import { parse } from "uuid";
import planController from "../controllers/plan-controller";
import { EXTERNAL_ACCOUNT_AUTHORIZED_USER_TYPE } from "google-auth-library/build/src/auth/externalAccountAuthorizedUserClient";
import { JsonWebTokenError } from "jsonwebtoken";

const router = Router()


router.post('/chat',
    body('senderId').isString().bail(),
    body('message').isString().bail(),
    body('thread_id').optional().isString().bail(),
    body('messageId').optional().isString().bail(),
    body('conversationId').optional().isUUID().bail(),
    validateRequest,
    async (req, res) => {
        console.log('Received chat webhook', req.body);
        const { senderId, message, thread_id: threadId, conversationId } = req.body
        let { messageId } = req.body;

        const server = req.app.get('socket.io')
        const socket = server.sockets.sockets.get(senderId)

        const conversation = conversationId && await conversationController.Read.byId({ id: conversationId });
        if (conversation) {
            const addedMessage = await conversationController.Update.addMessage({
                conversationId: conversation.id,
                text: message
            });

            messageId = addedMessage.id;
            if (conversation.threadId !== threadId) {
                await conversationController.Update.setThreadId({ conversationId: conversation.id, threadId });
            }
        }

        if (socket) {
            socket.emit('chat_message', JSON.stringify({
                message,
                threadId,
                messageId,
                convoId: conversationId,
            }));
        }

        res.status(200).json({ success: true });
    }
)

router.post('/tool',
    body('senderId').isString().bail(),
    body('message').isString().bail(),
    body('conversationId').isString().bail(),
    body('agent').isString().bail(),
    body('tool_call_id').optional().isString().bail(),
    body('runId').optional().isString().bail(),
    body('threadId').optional().isString().bail(),
    validateRequest,
    async(req, res) => {
        console.log('Received tool webhook', req.body);
        
        const { senderId, message, conversationId, agent, tool_call_id: toolCallId, runId, threadId } = req.body;

        const parsedMessage = formatter.getParsedJSONIfPossible(message);
        if (parsedMessage) {
            const queue = await dynamoHelper.getToolQueue({ agent });
            console.log(queue);
            await sqsHelper.sendMessageToToolAgent({
                senderId,
                message,
                conversationId,
                agent,
                toolCallId,
                runId,
                threadId,
                ...(queue && { queue })
            });
            return res.status(200).json({ success: true });
        }

        res.status(200).json({ success: true });
    }
);

router.post('/plan' , 
    body('senderId').isString().bail(),
    body('message').isString().bail(),
    body('depth').isInt().optional().bail(),
    body('threadId').optional().isString().bail(),
    body('conversationId').optional().isString().bail(),
    body('runId').optional().isString().bail(),
    body('tool_call_id').optional().isString().bail(),
    body('toolOutputs').optional().isString().bail(),
    body('systemType').optional().isString().bail(),
    body('planId').optional().isUUID().bail(),
    body('agentTask').optional().bail(),
    body('parentId').optional().isUUID().bail(),
    validateRequest,
    async(req, res) => {
        console.log('Received planner webhook', req.body);
         
        const { agentTask, senderId, message, conversationId, tool_call_id: toolCallId, runId, threadId , depth , planId, systemType , parentId } = req.body;
        const parsedMessage = formatter.getParsedJSONIfPossible(message);

        const conversation = await conversationController.Read.byId({id : conversationId})
        const botId = conversation.botId
        const agentId = await agentController.Read.byTask({
            task : agentTask, 
            botId : botId
        })
        if(!parsedMessage){
            console.log("Could not parse the message")
            throw new BadRequestError()
        }
        
        if(parsedMessage.plan){
            await handleReceivedPlanSteps(
                parsedMessage, 
                agentId, 
                conversationId, 
                senderId, 
                threadId,  
                toolCallId, 
                planId,
                parentId,
                systemType,
                depth,
                runId
            );      
        }else{
           if(depth == 0){
              console.log("Creating new Task")
              console.log(agentTask)
               await createNewTask(
                    agentId, 
                    parsedMessage, 
                    depth, 
                    "planner", 
                    senderId, 
                    conversationId, 
                    toolCallId, 
                    runId, 
                    threadId,
                    systemType
                );
            }else{
                if(parsedMessage.action == 'continue'){
                    const task =  await taskQueueController.Read.dequeue(conversationId)
                    console.log(task)
                    if(task == null){
                        await handleCompletedPlan(planId, senderId, threadId, conversationId, toolCallId, runId);
                    }else{
                        if(task.taskExecution.taskType == 'executable'){
                            const message = JSON.parse(task.taskExecution.taskContent)
                            console.log("Sending message back to the chat agent for executable with thread id: ", threadId);
                            await sqsHelper.sendMessageToChatAgent({
                                senderId,
                                threadId,
                                conversationId,
                                toolCallId,
                                toolOutputs: JSON.stringify(parsedMessage),
                                planId,
                                runId
                            })
                        }
                        if(task.taskExecution.taskType == 'intermediary'){                            
                                const queue = await dynamoHelper.getToolQueue({  agent : 'planner' });
                                console.log(queue);
                                const message = JSON.parse(task.taskExecution.taskContent)
                                console.log(message)
                                message['is_user_task'] = false
                                message['depth'] = task.taskExecution.depth
                                
                                console.log("Calling planner agent")
                                await sqsHelper.sendMessageToToolAgent({
                                    senderId,
                                    message: JSON.stringify(message),
                                    conversationId,
                                    agent : 'planner',
                                    toolCallId,
                                    runId,
                                    threadId,
                                    planId,
                                    parentId : task.taskExecution.id,
                                    ...(queue && { queue })
                                });
                                return res.status(200).json({ success: true });
                        }
                    
                    }
                }
            }
        
        }
        res.status(200).json({ success: true });
    } 
)

router.post('/tool-to-chat',
    body('senderId').isString().bail(),
    body('message').isString().bail(),
    body('threadId').optional().isString().bail(),
    body('conversationId').optional().isString().bail(),
    body('runId').optional().isString().bail(),
    body('agent').optional().isString().bail(),
    body('tool_call_id').optional().isString().bail(),
    body('toolOutputs').optional().isString().bail(),
    validateRequest,
    async(req, res) => {
        console.log('Received tool to chat webhook', req.body);

        const { senderId, message, threadId, conversationId, runId, agent, tool_call_id: toolCallId, toolOutputs } = req.body;
        console.log("Sending message back to the chat agent after receiving tool to chat webhook with thread id: ", threadId);

        await sqsHelper.sendMessageToChatAgent({
            senderId,
            threadId,
            runId,
            textInput: message,
            conversationId,
            toolCallId,
            toolOutputs: toolOutputs || message,
        })

        res.status(200).json({ success: true });
    }
);

export { router as webhookRouter }

async function handleCompletedPlan(planId, senderId, threadId, conversationId, toolCallId, runId) {
    const plan = await planController.Read.byId(planId);
    const tree = await agentController.Read.taskTree({ root: plan.rootId, idsOnly: false });
    const message = JSON.stringify(tree);
    const treeOutput = formatter.convertTaskTreeOutput(tree);
    JSON.parse(treeOutput);

    console.log("Sending message back to the chat agent after complete plan with thread id: ", threadId);

    await sqsHelper.sendMessageToChatAgent({
        senderId,
        threadId,
        textInput: message,
        conversationId,
        toolCallId,
        runId,
    });
}

async function createNewTask(agentId, message, depth, agent, senderId, conversationId, toolCallId, runId, threadId, systemType) {
    console.log(message)
    const jsonMessage = JSON.stringify(message)
    console.log("Invoking new Task")
    console.log(agentId)
    const task = await agentController.Create.newTask({
        agentId : agentId.id,
        taskData: jsonMessage,
        taskType: 'root',
        systemType: systemType,
        depth: depth
    });

    console.log("Creating Plan")
    console.log(task.id)
    const plan = await planController.Create.new({ conversationId : conversationId,  rootId: task.id });
    console.log("Created Plan")
    console.log(plan.id)
    console.log(agent)

    const queue = await dynamoHelper.getToolQueue({ agent });
    console.log(queue)
   

    const newMessage = {
        task: message.description.description,
        description : message.description,   
        is_user_task : false,
    
    }


    await sqsHelper.sendMessageToToolAgent({
        senderId,
        message: JSON.stringify(newMessage),
        conversationId,
        agent,
        toolCallId,
        runId,
        threadId,
        planId: plan.id,
        parentId : task.id,
        ...(queue && { queue })
    });
}

async function handleReceivedPlanSteps(parsedMessage, agentId, conversationId, senderId, threadId, toolCallId, planId , parentId, systemType, depth, runId) {
    for (let i = parsedMessage.plan.length-1; i >= 0 ; i--) {  // Fix loop condition

        const task = await agentController.Create.newTask({
            agentId: agentId.id,
            taskData: JSON.stringify(parsedMessage.plan[i]),  // Fix method name
            taskType: parsedMessage.plan[i].type,
            parentId: parentId,
            systemType: systemType,
            depth: depth
        });

        const queue = await taskQueueController.Create.enqueue({
            conversationId,
            taskExecution: task.id,
            priority: 0
        });
    }
    console.log("Sending message back to the chat agent after receiving plan steps with thread id: ", threadId);
    await sqsHelper.sendMessageToChatAgent({
        senderId,
        threadId,
        conversationId,
        toolCallId,
        toolOutputs: JSON.stringify(parsedMessage),
        planId,
        runId
    });
}