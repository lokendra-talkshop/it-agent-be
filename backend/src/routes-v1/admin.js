import { Router } from 'express';
import { body, query } from 'express-validator';
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

import { botErrors, userErrorCodes } from '../configs/errors';

import botController from '../controllers/bot-controller';

import { UploadFileToS3, S3ObjectReader } from '../services/s3-media';
import appConfig from '../configs';
import authController from '../controllers/auth-controller';

import adminController from '../controllers/admin-controller';

import presignedUrlsController from "../controllers/presigned-urls-controller";

const router = Router()



router.post("/auth",
  validateRequest,
  async (req, res) => {
    const user = await authController.Authenticator.authenticateUser(req.token)
    if (!user) {
      throw NotAuthorizedError()
    }
    let adminUser = await adminController.Read.byEmail(user.email)
    console.log(adminUser)
    if (adminUser) {
      const role = await adminController.Read.getRole({ id: adminUser.id });
      const token = await adminController.Tokens.createJWTTokens(adminUser);
      res.status(200).json({ token, role });

    } else {
      throw NotAuthorizedError()
    }

  }
)

router.get("/bots",
  new RoleAuthenticators([{ type: UserTypes.admin }]).verifyRole(),
  validateRequest,
  async (req, res) => {
    const { id } = req.tokenPayload;
    const canPerformAction = await adminController.Read.canPerformAction({ id, action: adminActions.VIEW_BOTS });
    if (!canPerformAction) {
      throw new NotAuthorizedError();
    }
    const adminUser = await adminController.Read.byId(id);

    const { page } = req.query;
    const take = 300;
    const skip = page ? 300 * page : 0;
    const bots = await botController.Read.all({ skip, take })
    console.log(bots)
    const count = await botController.Read.countAll({})
    console.log(count)
    res.status(200).json({ bots, count });
  },
);

router.get("/bot",
  new RoleAuthenticators([{ type: UserTypes.admin }]).verifyRole(),
  query('botId').isUUID().bail(),
  validateRequest,
  async (req, res) => {
    console.log("Calling function")
    const { id } = req.tokenPayload;
    console.log("got token")
    const canPerformAction = await adminController.Read.canPerformAction({ id, action: adminActions.CREATE_BOTS });
    if (!canPerformAction) {
      throw new NotAuthorizedError();
    }
    const { botId } = req.query
    console.log(botId)

    const bot = await botController.Read.byId(botId)
    if (!bot) {
      throw new BadRequestError(botErrors.botNotFound)
    }
    console.log(bot)

    const botConfigUrl = bot.configLocation

    console.log(botConfigUrl)
    const [bucket, key] = botConfigUrl.replace("s3://", "").split("/")
    console.log(bucket)
    console.log(key)


    const configFile = await S3ObjectReader.getObjectData(key, bucket)
    const configData = JSON.parse(configFile)
    console.log(configData)
    configData.task = configData.description
    configData.description = undefined
    const newBotData = { ...configData, ...bot }

    res.status(200).json({ bot: newBotData })

  }

)

router.post("/bot",
  new RoleAuthenticators([{ type: UserTypes.admin }]).verifyRole(),
  validateRequest,
  body("name").isString().bail(),
  body("description").isString().bail(),
  body("image").isString().bail(),
  body("service").isString().bail(),
  body("model").isString().bail(),
  body("greeting").isString().bail(),
  body("persona").isString().bail(),
  body("task").isString().bail(),
  body('title').isString().bail(),
  body('samplePrompts').isArray().optional().bail().toArray().bail(),
  body('coverImage').optional().bail(),
  async (req, res) => {
    const { id } = req.tokenPayload;
    const canPerformAction = await adminController.Read.canPerformAction({ id, action: adminActions.CREATE_BOTS });
    if (!canPerformAction) {
      throw new NotAuthorizedError();
    }
    const { name, description, image, service, model, greeting, persona, task, title, samplePrompts, coverImage } = req.body

    const adminUser = await adminController.Read.byId(id);

    const presignedURL = await presignedUrlsController.Read.byId(image);

    if (!presignedURL) {
      throw new BadRequestError(validationErrors.invalidInput);
    }

    const imageURL = presignedUrlsController.Read.getPublicDistributionURL(presignedURL);

    console.log(imageURL)
    const coverImagePresignedUrl = await presignedUrlsController.Read.byId(coverImage)

    if (!coverImagePresignedUrl) {
      throw new BadRequestError(validationErrors.invalidInput);
    }

    const coverImageUrl = presignedUrlsController.Read.getPublicDistributionURL(coverImagePresignedUrl)

    console.log(coverImageUrl)

    const newBot = await botController.Create.new({ name, description, imageUrl: imageURL, coverImage: coverImageUrl })


    const createdPrompts = await botController.Create.addSamplePrompts({ botId: newBot.id, prompts: samplePrompts })

    const botConfigFileName = newBot.id + ".json"

    const configUploader = new UploadFileToS3('us-east-2', appConfig.bot_config_bucket)
    const configFile = {
      name: name,
      greeting: greeting,
      service: service ? service : 'openai',
      model: model ? model : 'gpt-4o',
      title: title,
      persona: persona,
      description: task
    }
    const fileUpload = await configUploader.putFile(configFile, botConfigFileName, "application/json", JSON.stringify)
    const botConfigUrl = `s3://${appConfig.bot_config_bucket}/${botConfigFileName}`

    await botController.Update.setConfigLocation({ id: newBot.id, url: botConfigUrl })
    const finalBot = await botController.Read.byId(newBot.id)
    res.status(200).json({ bot: finalBot })

  }
)


router.put("/bot",
  new RoleAuthenticators([{ type: UserTypes.admin }]).verifyRole(),
  validateRequest,
  body("botId").isUUID().bail(),
  body("name").isString().bail().optional(),
  body("description").isString().bail().optional(),
  body("image").isString().bail().optional(),
  body("service").isString().bail().optional(),
  body("model").isString().bail().optional(),
  body("greeting").isString().bail().optional(),
  body("persona").isString().bail().optional(),
  body("task").isString().bail().optional(),
  body('title').isString().bail().optional(),
  body('isActive').optional().isBoolean().bail().toBoolean().bail(),
  body('samplePrompts').isArray().optional().bail().toArray().bail(),
  body('coverImage').optional().bail(),
  async (req, res) => {
    const { id } = req.tokenPayload;
    const canPerformAction = await adminController.Read.canPerformAction({ id, action: adminActions.CREATE_BOTS });
    if (!canPerformAction) {
      throw new NotAuthorizedError();
    }
    const { botId, name, description, image, service, model, greeting, persona, task, title, coverImage } = req.body

    const adminUser = await adminController.Read.byId(id);

    const bot = await botController.Read.byId(botId)
    if (!bot) {
      throw new BadRequestError(botErrors.botNotFound)
    }

    const botConfigUrl = bot.botConfigLocation
    const [bucket, key] = botConfigUrl.replace("s3://", "").split("/")

    const configFile = await S3ObjectReader.getObjectData(key, bucket)
    const configData = JSON.parse(configFile)
    let coverImageUrl = undefined
    let imageURL = undefined
    if (image) {

      const presignedURL = await presignedUrlsController.Read.byId(image);

      if (!presignedURL) {
        throw new BadRequestError(validationErrors.invalidInput);
      }

      imageURL = presignedUrlsController.Read.getPublicDistributionURL(presignedURL);
    }
    if (coverImage) {
      const coverImagePresignedUrl = await presignedUrlsController.Read.byId(coverImage)

      if (!coverImagePresignedUrl) {
        throw new BadRequestError(validationErrors.invalidInput);
      }

      coverImageUrl = presignedUrlsController.Read.getPublicDistributionURL(coverImagePresignedUrl)
    }
    await botController.Update.update({ id: botId, name, description, imageUrl: imageURL, isActive: isActive, coverImage: coverImageUrl })

    const newConfig = {
      name: name ? name : configData.name,
      greeting: greeting ? greeting : configData.greeting,
      service: service ? service : configData.service,
      model: model ? model : configData.model,
      title: title ? title : configData.title,
      persona: persona ? persona : configData.persona,
      description: task ? task : configData.description,
      file_processors : configData.file_processors
    }
    await botController.Update.replaceSamplePrompts({ botId, samplePrompts })
    const configUploader = new UploadFileToS3('us-east-2', appConfig.bot_config_bucket)
    const fileUpload = await configUploader.putFile(newConfig, key, "application/json", JSON.stringify)

    const finalBot = await botController.Read.byId(botId)
    res.status(200).json({ bot: finalBot })

  }
)

router.delete("/bot",
  new RoleAuthenticators([{ type: UserTypes.admin }]).verifyRole(),
  body('botId').isUUID().bail(),
  validateRequest,
  async (req, res) => {
    const { id } = req.tokenPayload;
    const canPerformAction = await adminController.Read.canPerformAction({ id, action: adminActions.CREATE_BOTS });
    if (!canPerformAction) {
      throw new NotAuthorizedError();
    }
    const { botId } = req.body
    const deleted = await botController.Delete.byId(botId)
    res.status(200).json({ deleted })

  }
)



router.get(
  '/media/pre-signed-put-url',
  new RoleAuthenticators([{ type: UserTypes.admin }]).verifyRole(),
  query('contentType')
    .optional()
    .isString()
    .custom((v) => /image\/.*/.test(v)), // Regex match for image type,
  validateRequest,
  async (req, res) => {
    const { contentType } = req.query;
    const { id } = req.tokenPayload;
    const presignedURL = await presignedUrlsController.Create.newBotImage(id, contentType);
    res.status(201).json({ presignedURL });
  },
);




export { router as adminRouter }
