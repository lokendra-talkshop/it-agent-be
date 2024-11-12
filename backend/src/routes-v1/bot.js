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

import { botErrors, userErrorCodes } from '../configs/errors';

import botController from '../controllers/bot-controller';
import conversationController from '../controllers/conversation-controller';
import agentController from '../controllers/agent-controller';

const router = Router()

router.get("/", 
    new RoleAuthenticators([{type : UserTypes.user}]).verifyRole(),
    query('botId').isUUID().optional().bail(),
    query('page').isInt().optional().bail(),
    validateRequest,
    async (req, res) => {
        const {id} = req.tokenPayload
        const {botId} = req.query


        if(botId){
            const [bot, likeCount, isLiked, convoCount, agents]  = await Promise.all([
                                            botController.Read.byId(botId),
                                            botController.Read.likeCount(botId),
                                            botController.Read.isLiked({id : botId, userId : id}),
                                            conversationController.Read.countForBot({botId}),
                                            agentController.Read.byBot({id : botId})

                                      ])
            if(!bot){
                throw new BadRequestError(botErrors.botNotFound)
            }
            bot['likes'] = likeCount,
            bot['isLiked'] = isLiked
            bot['chats'] = convoCount
            bot['isagent'] = agents.length > 0 
            res.status(200).json({bot })
                            
        }else{
            const { page } = req.query;
            const take = 300;
            const skip = page ? 300 * page : 0;
            const bots =  await botController.Read.all({skip, take })
            const updatedBots = await Promise.all(bots.map(async (bot, idx) => {
                 const [likeCount, isLiked, convoCount, isagent] = await Promise.all([
                    botController.Read.likeCount(bot.id), 
                    botController.Read.isLiked({botId : bot.id, userId : id}),
                    conversationController.Read.countForBot({botId : bot.id}),
                    agentController.Read.byBot({id : botId})
                 ])
                 console.log(idx)
                 return {
                    ...bot,
                    likes: likeCount,
                    chats : convoCount,
                    isLiked,
                    isagent : isagent.length > 0 
                 }

            }))
            res.status(200).json({bots : updatedBots})

        }
    }
)

router.post("/like",
    new RoleAuthenticators([{type : UserTypes.user}]).verifyRole(),
    body('botId').isUUID().optional().bail(),
    validateRequest,
    async (req, res) => {
        const {id} = req.tokenPayload
        const {botId} = req.body
        const bot = await botController.Read.byId(botId)
        if(!bot){
           throw new BadRequestError(botErrors.botNotFound)
        } 
        const like = await botController.Create.like({botId : bot.id, userId : id})
        res.status(200).json({like})
    }
)

router.post("/unlike",
    new RoleAuthenticators([{type : UserTypes.user}]).verifyRole(),
    body('botId').isUUID().optional().bail(),
    validateRequest,
    async (req, res) => {
        const {id} = req.tokenPayload
        const {botId} = req.body
        const bot = await botController.Read.byId(botId)
        if(!bot){
           throw new BadRequestError(botErrors.botNotFound)
        } 
        const like = await botController.Delete.unLike({botId : bot.id, userId : user.id})
        res.status(200).json({like})
    }

)

router.post("/dislike",
    new RoleAuthenticators([{type : UserTypes.user}]).verifyRole(),
    body('botId').isUUID().optional().bail(),
    validateRequest,
    async (req, res) => {
        const {id} = req.tokenPayload
        const {botId} = req.body
        const bot = await botController.Read.byId(botId)
        if(!bot){
           throw new BadRequestError(botErrors.botNotFound)
        } 
        const like = await botController.Create.dislike({botId : bot.id, userId : id})

        res.status(200).json({like})
    }

)



export {router as botRouter }