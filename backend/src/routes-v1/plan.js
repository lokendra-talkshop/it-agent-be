import { Router } from "express";
import { RoleAuthenticators, validateRequest } from "../node-utils";
import agentController from "../controllers/agent-controller";
import {v4 as uuid4} from "uuid"
import messageController from "../controllers/message-controller";
const router = Router()
import { body } from "express-validator";



router.delete("/step", 
    new RoleAuthenticators([{type : UserTypes.user}]).verifyRole(),
    body('messageId').isInt().optional().bail(),
    body('taskIdx').isInt().optional().bail(),
    validateRequest,
    async (req, res) => {
         const {messageId, taskIdx } = req.body
         const tasks = await messageController.Read.getTasksForMessage({messageId , reverseOrder : true})
         await agentController.Delete.deleteTask({taskId : tasks[taskIdx].id})
         const newTasks = await messageController.Read.getTasksForMessage({messageId , reverseOrder : true})
         res.status(200).json({plan : newTasks})
    }
)


router.put("/step", 
    new RoleAuthenticators([{type : UserTypes.user}]).verifyRole(),
    body('messageId').isInt().optional().bail(),
    body('taskIdx').isInt().optional().bail(),
    body("newStep").isString().bail(),
    validateRequest,
    async (req, res) => {
        /*
        const {messageId, taskIdx, newStep} = req.body
        const tasks = await messageController.Read.getTasksForMessage({messageId , reverseOrder : true})
        const task = tasks[taskIdx]
        const content = JSON.parse(task.taskContent)
        content.description = newStep
        const newContent = JSON.stringify(content)
        await agentController.Update.updateTaskContent({taskId : task.id, newContent})
        const tasks = await messageController.Read.getTasksForMessage({messageId , reverseOrder : true})
        res.status(200).json({plan: tasks})
       */
    }
)

export {router as planRouter }