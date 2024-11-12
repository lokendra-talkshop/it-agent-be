import { Router } from 'express';
import { body, query } from 'express-validator';
import {
  BadRequestError,
  RoleAuthenticators,
  validateRequest,
  UserTypes,
  NotAuthorizedError,
  adminActions,
  loggerInstance,
} from '../node-utils';

import { botErrors, messageErrors, userErrorCodes } from '../configs/errors';

import botController from '../controllers/bot-controller';
import clipBoardController from '../controllers/clip-board-controller';
import messageController from '../controllers/message-controller';
import reportController from '../controllers/report-controller';


const router = Router()


router.post("/save",
    new RoleAuthenticators([{type : UserTypes.user}]).verifyRole(),
    body('messageId').isUUID().optional().bail(),
    validateRequest,
    async (req, res) => {
        const {id} = req.tokenPayload
        const {messageId} = req.body
        const message = await messageController.Read.byId({messageId})
        if(!message){
            throw new BadRequestError(messageErrors.messageNotFound)
        }
        const saveResult = await clipBoardController.Create.save({messageId, userId : id})
        res.status(200).json({saveResult})
    }     
)



router.delete("/",
    new RoleAuthenticators([{type : UserTypes.user}]).verifyRole(),
    body('messageId').isUUID().optional().bail(),
    validateRequest,
    async (req, res) => {
        const {id} = req.tokenPayload
        const {messageId} = req.body
        const message = await messageController.Read.byId({messageId})
        if(!message){
            throw new BadRequestError(messageErrors.messageNotFound)
        }
        const result = await messageController.Delete.byId(messageId)
        res.status(200).json({result})
    }
)


router.post("/report",
    new RoleAuthenticators([{type : UserTypes.user}]).verifyRole(),
    body('messageId').isUUID().optional().bail(),
    body('reason').optional().bail(),
    validateRequest,
    async (req, res) => {
        const {id} = req.tokenPayload
        const {messageId, reason} = req.body
        const message = await messageController.Read.byId({messageId})
        if(!message){
            throw new BadRequestError(messageErrors.messageNotFound)
        }
        await reportController.Create.forMessage({userId : id, messageId : message.id, reason })
       
        res.status(200).json({result})
    }
)



export {router as messageRouter }