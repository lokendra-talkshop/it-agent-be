import { clipBoardErrors, userErrorCodes } from "../configs/errors"
import usersController from "../controllers/users-controller"
import {BadRequestError, loggerInstance, NotAuthorizedError, UserTypes} from "../node-utils"
import { RoleAuthenticators, validateRequest } from "../node-utils"
import {body, query} from "express-validator"
import { Router } from "express"
import authController from "../controllers/auth-controller"
import clipBoardController from "../controllers/clip-board-controller"
const router = Router()

router.post("/auth",
    validateRequest,
    async (req, res) => {
        try {
            const user = await authController.Authenticator.authenticateUser(req.token)
            if (!user) {
                throw new NotAuthorizedError()
            }
            let appUser = await usersController.Read.byEmail({email: user.email})
            if (appUser) {
                const token = usersController.Tokens.createJWTToken(appUser);
                res.status(200).json({token, user: appUser});
            } else {
                loggerInstance.info("Creating new user")
                appUser = await usersController.Create.new(user.email)
                const token = usersController.Tokens.createJWTToken(appUser);
                res.status(200).json({token, user: appUser, isNew: true})
            }
        } catch (error) {
            loggerInstance.error(error)
            throw new Error("Error authenticating user");
        }
    }
)


router.put("/",
    new RoleAuthenticators([{ type: UserTypes.user }]).verifyRole(),
    body('name').optional().bail(),
    body("dob").optional().bail(),
    validateRequest,
    async (req, res) => {
        const { id } = req.tokenPayload
        let user = await usersController.Read.byId(id)
        if (!user) {
            throw new BadRequestError(userErrorCodes.userNotFound)
        }
        const { name , dob } = req.body
        if (name != undefined) {
            await usersController.Update.addName(id, name)
        }
        const legalAge = 18
        if (dob != undefined) {
            let isLegalAge = false
            const dateDiff = new Date() - new Date(dob)
            const legalAgeInMillis = legalAge * 365 * 24 * 60 * 60 * 1000
            if(dateDiff > legalAgeInMillis){
                 isLegalAge = true
            }  
            await usersController.Update.updateIsOfLegalAge({userId : id, isOfLegalAge : isLegalAge})
        }
        user = await usersController.Read.byId(id)
        res.status(200).json({ user })
    }

)




router.get("/",
    new RoleAuthenticators([{ type: UserTypes.user }]).verifyRole(),
    validateRequest,
    async (req, res) => {
        const { id } = req.tokenPayload
        console.log(id)
        let user = await usersController.Read.byId(id)
        console.log(user)
        if (!user) {
            throw new BadRequestError(userErrorCodes.userNotFound)
        }
        res.status(200).json({ user })
    }
)

router.get("/clipboard",
    new RoleAuthenticators([{ type: UserTypes.user }]).verifyRole(),
    query('botId').isUUID().optional().bail(),
    validateRequest,
    async (req, res) => {
        const { id } = req.tokenPayload
        const {botId} = req.query
        const clipBoard = await clipBoardController.Read.entries({userId : id , botId})
        res.status(200).json({clipBoard})
    }
)

router.delete("/clipboard",
    body("entryId").isUUID().bail(),
    new RoleAuthenticators([{ type: UserTypes.user }]).verifyRole(),
    validateRequest,
    async (req, res) => {
        const { id } = req.tokenPayload
        const {entryId} = req.body
        const entry = await clipBoardController.Read.entry({entryId })
        if(!entry || entry.userId != id){
             throw new BadRequestError(clipBoardErrors.invalidEntryId)
        }

        const result = await clipBoardController.Delete.byId({id : entryId })
 
        res.status(200).json({clipBoard})
    }


)


export { router as userRouter }
