import { Router } from "express";
import { chatRouter } from "./chat";
import { adminRouter } from "./admin";
import { body, query, validationResult } from 'express-validator';
import {
  BadRequestError,
  RoleAuthenticators,
  validateRequest,
  UserTypes,
  parse_csv,
  NotAuthorizedError,
  adminActions,
  loggerInstance,
} from '../node-utils';

import { validationErrors } from "../configs/errors";
import presignedUrlsController from "../controllers/presigned-urls-controller";
import { userRouter } from "./user";
import { botRouter } from "./bot";
import { messageRouter } from "./message";
import { conversationRouter } from "./conversations";
import { webhookRouter } from "./webhook";
import { memoryRouter } from "./memory";

const router = Router()

router.use("/chat", chatRouter)
router.use("/admin", adminRouter)
router.use("/users", userRouter)
router.use("/bot", botRouter)
router.use("/convo", conversationRouter)
router.use("/message", messageRouter)
router.use("/webhook", webhookRouter)
router.use("/memory", memoryRouter)

router.get(
    '/media/pre-signed-put-url',
    new RoleAuthenticators([{ type: UserTypes.user }]).verifyRole(),
    query('mediaType').optional().bail(),
    query('contentType')
      .optional()
      .isString(),
    validateRequest,
    async (req, res) => {
      const { contentType , mediaType } = req.query;
      const { id } = req.tokenPayload;
      console.log(mediaType)
      if(mediaType == 'attachment'){
        if(/image\/.*/.test(contentType) || /application\/pdf/.test(contentType)){
          const url = await presignedUrlsController.Create.newUserAttachment(id, contentType);
          res.status(201).json({presignedURL : url});  
        }else{
          throw new BadRequestError(validationErrors.invalidInput)
          
        }
        
      }else{
        if(/image\/.*/.test(contentType)){
           const url = await presignedUrlsController.Create.newUserImage(id, contentType);
           res.status(201).json({presignedURL : url});
        }else{
          throw new BadRequestError(validationErrors.invalidInput)
        }
        
      }
        
  
    },
  );
  

export { router as v1Router }