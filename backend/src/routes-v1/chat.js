import { Router } from "express";
import { validateRequest } from "../node-utils";
import { body } from "express-validator";
import conversationController from "../controllers/conversation-controller";
import agentController from "../controllers/agent-controller";
import {v4 as uuid4} from "uuid"
import taskQueueController from "../controllers/task-queue-controller";
import { JsonWebTokenError } from "jsonwebtoken";
import { updateState } from "../helpers/send-message-helper";
const router = Router()


router.post("/execution", 
    body('senderId').isString().bail(),
    body('payload').isString().bail(),
    body('taskId').isUUID().bail(),
    body('convoId').isUUID().bail(),
    body("agentId").isUUID().bail(),
    validateRequest,
    async (req, res) => {
        const {taskId, convoId, payload , senderId, agentId } = req.body

        const server = req.app.get('socket.io')
        const socket = server.sockets.sockets.get(senderId)
        const actions = JSON.parse(payload)
        const task = await agentController.Read.taskById({id : taskId})
        await agentController.Update.executeTask({taskId})
        const conversation = await conversationController.Read.byId({id : convoId})

        if(task.systemStepType == 'system2'){
            await taskQueueController.Create.enqueue({
                conversationId : conversation.id,
                taskExecution : task.id,
                priority : 0
            })
        }
        console.log(actions)
        for(let i = actions.length-1 ; i >= 0 ;i--){
           const actionableTask = await agentController.Create.newTask({
               agentId : agentId, 
               taskData: JSON.stringify(actions[i]),
               taskType : 'code_execution',
               parentId : task.id,
               systemType : task.systemStepType
           })
           await taskQueueController.Create.enqueue({
            conversationId : conversation.id,
            taskExecution : actionableTask.id,
            priority : 0
          })
        }
        while(true){
            const topOfQueue = await taskQueueController.Read.peek()
            console.log("Top of Queue")
            console.log(topOfQueue)
            if(topOfQueue.taskExecution.taskType == 'code_execution'){
                const topOfQueueJson = JSON.parse(topOfQueue.taskExecution.taskContent)
                if(topOfQueueJson.action == "fetch_user_data"){
                    
                    const dbMessage = await conversationController.Update.addMessage({
                        conversationId: conversation.id,
                        text : topOfQueueJson.message,
                    })
                    
                    console.log("Inserted dbMessage")
                    const dbMessageId = dbMessage.id
                    await agentController.Update.assignMessageToTask({taskId: topOfQueue.taskExecution.id , messageId : dbMessageId})
                    socket.emit("chat_message", JSON.stringify(
                        {
                            'message' : topOfQueueJson.message,
                            'messageId' : dbMessageId,
                            'convoId' : convoId,
                            'threadId' : conversation.threadId,
                            'agentId': agentId,
                            'botConfigId' : conversation.botId,
                            'agentTask' : topOfQueue.taskExecution.taskType,
                            'agentAction' : topOfQueueJson.action
                        }
                    ))
                    break
                }else if(topOfQueueJson.action == 'update_state'){
                    await taskQueueController.Read.dequeue(conversation.id)
                    updateState(topOfQueueJson, [], topOfQueue.taskExecution.parentNode)
                }
                
            }else{
                const messageConfirmId = uuid4()
                socket.emit("confirm_advance_message", JSON.stringify({
                    'message' : "Continue executing plan ?",
                    'botConfigId' : conversation.botId,
                    'threadId' : conversation.threadId,
                    'messageId' : messageConfirmId,
                    'convoId' : convoId,
                }))
                break
            }
        }
        res.status(200).json({"success" : true})    
    }
)         

router.post("/message",
  body('senderId').isString().bail(),
  body('message').isString().bail(),
  body('thread_id').optional().isString().bail(),
  body('botId').optional().isUUID().bail(),
  body("botConfigId").optional().isString().bail(),
  body('messageId').optional().isString().bail(),
  body('agentTask').optional().isString(),
  body('convoId').optional().isUUID().bail(),
  body('taskParentId').optional().isUUID().bail(),
  body('depth').optional().isInt().bail(),
  validateRequest,
  async (req, res) => {
     const {senderId, message, thread_id, botConfigId, messageId, convoId, agentTask, taskParentId , botId , depth } = req.body
     const server = req.app.get('socket.io')
     const socket = server.sockets.sockets.get(senderId)
     console.log("Got Conversation ConvoId");
     console.log(convoId)

     console.log(`Depth is ${depth}`)
     
     let dbMessageId = messageId
     let agentId = null
     if(convoId){
        const conversation = await conversationController.Read.byId({id : convoId})
        console.log(conversation)
        if(conversation){
            const dbMessage = await conversationController.Update.addMessage({
                conversationId: conversation.id,
                text : message,
            })
            console.log("Inserted dbMessage")
            dbMessageId = dbMessage.id
            if (conversation.threadId!=thread_id){
                await conversationController.Update.setThreadId({
                    conversationId : conversation.id, 
                    threadId : thread_id
                })
           }
         
           console.log("Updated Thread")
           if(agentTask){
               console.log("Getting agent task")
               const agent = await agentController.Read.byTask({ botId, task : agentTask })
               console.log(agent)
               agentId = agent.id
               if(agent.role == 'plan'){
                    const plan = JSON.parse(message).plan
                    for(let i = plan.length-1 ; i >=0 ; i--){
                        
                        if(taskParentId!=null){
                            const parent =  await agentController.Read.taskById({id : taskParentId})   
                            console.log(parent)
                            if(parent){
                                const parentContent = JSON.parse(parent.taskContent)
                                plan[i].tools = parentContent.tools ? parentContent.tools : (parentContent.description?.tools ? parentContent.description.tools : [] )
                            }
                        }
                        
                        const task = await agentController.Create.newTask({
                            agentId : agent.id, 
                            taskData : JSON.stringify(plan[i]) , 
                            taskType : plan[i].type , 
                            parentId :  taskParentId , 
                            messageId : dbMessageId,
                            depth : depth ? depth : 0
                        })                                        
                        await taskQueueController.Create.enqueue({
                            conversationId : conversation.id,
                            taskExecution : task.id,
                            priority : 0
                        })
                    }
            
               }else if (agent.role == 'task'){
                   console.log("Creating new Task")
                   const task = await agentController.Create.newTask({
                       agentId : agent.id,
                       taskData : message,
                       messageId : dbMessageId,
                       taskType : "task",
                       depth : 0, 
                   })
                   console.log("Adding to the queue")
                   await taskQueueController.Create.enqueue({
                     conversationId : conversation.id,
                     taskExecution : task.id,
                     priority : 0
                   })
               }else if(agent.role == 'code'){
                   const task = await agentController.Create.newTask({
                      agentId : agent.id,
                      taskData : message, 
                      parentId : taskParentId,
                      messageId : dbMessageId,
                      taskType : "code",
                      depth : depth ? depth : 0
                   })
                   await taskQueueController.Create.enqueue({
                    conversationId : conversation.id,
                    taskExecution : task.id,
                    priority : 0
                  })

               }

           }

        }
        console.log("Written")        
     }
     
     if(socket){
        socket.emit("chat_message", JSON.stringify(
            {
                'message' : message,
                'threadId' : thread_id ,
                'botConfigId' : botConfigId,
                'messageId' : dbMessageId,
                'convoId' : convoId,
                'agentId': agentId,
                'agentTask' : agentTask
            }
        ))
        console.log("sending confirmation")
        const messageConfirmId = uuid4()
        socket.emit("confirm_advance_message", JSON.stringify({
            'message' : "Continue executing plan ?",
            'botConfigId' : botConfigId,
            'threadId' : thread_id,
            'messageId' : messageConfirmId,
            'convoId' : convoId,
        }))
     }

     res.status(200).json({"success" : true})
    }
)




export {router as chatRouter }