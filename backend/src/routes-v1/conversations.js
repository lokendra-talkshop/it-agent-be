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

import { conversationErrors, userErrorCodes } from '../configs/errors';

import botController from '../controllers/bot-controller';
import conversationController from '../controllers/conversation-controller';



const router = Router()


router.get("/",
    new RoleAuthenticators([{type : UserTypes.user}]).verifyRole(),
    query('botId').isUUID().optional(),
    query('convoId').isUUID().optional(),
    validateRequest,
    async (req, res) => {
       const {id} = req.tokenPayload

       const {botId , convoId} = req.query
       if(convoId){
          const conversation = await conversationController.Read.byId({id : convoId})
          if(!conversation){
            throw new BadRequestError(conversationErrors.conversationNotFound)
          }
          res.status(200).json({conversation})

       }else{
       const bot = await botController.Read.byId(botId)
       if(!bot){
         throw new BadRequestError(conversationErrors.conversationNotFound)
       }

       const convo = await conversationController.Read.forUser({userId : id, botId : bot.id})
       const conversations = await Promise.all(convo.map( async (conversation)=> {
          const lastMessage = await conversationController.Read.getMostRecentMessage({convoId : conversation.id})
          return {
              ...conversation,
              latestMessage : lastMessage
          }
       }))       

       res.status(200).json({conversations})
      }
    }
)



router.get("/most-recent-by-bot",
   new RoleAuthenticators([{type : UserTypes.user}]).verifyRole(),
   validateRequest,
   async (req, res) => {
        const {id} = req.tokenPayload
        console.log("Getting recent bots")
        console.log(id)
        const conversations = await conversationController.Read.getMostRecentUniqueConvos({userId: id}) 

        res.status(200).json({conversations}) 
   }
);



router.get("/messages",
   new RoleAuthenticators([{type : UserTypes.user}]).verifyRole(),
   query("conversationId").isUUID().bail(),
   validateRequest,
   async (req, res) => {
         const {id} = req.tokenPayload 
         const {conversationId} = req.query
         console.log(conversationId)
         const messages = await conversationController.Read.getMessages({id : conversationId})
         console.log(messages)
         res.status(200).json({messages})
   }

)

export {router as conversationRouter }
