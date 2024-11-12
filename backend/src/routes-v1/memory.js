import { Router } from "express";
import { BadRequestError, validateRequest } from "../node-utils";
import { body } from "express-validator";
import memoryController from "../controllers/memory-controller";

const router = Router();

router.post(
  '/memory',
  body('key').isString().optional().bail(),
  body('value').isString().optional().bail(),
  body('action').isString().bail(),
  body('planId').isUUID().bail(),
  validateRequest,
  async (req, res) => {
    const { key, value, action, planId } = req.body;

    if (action === 'store') {
      if (!key || !value) {
        throw new BadRequestError();
      }
      await memoryController.Create.put({ planId, key, value });
      res.status(200).json({ success: true });
    } else if (action === 'get') {
      let memory = null;
      if (key) {
        memory = await memoryController.Read.get({ planId, key });
      } else {
        memory = await memoryController.Read.items({ planId });
      }
      res.status(200).json({ memory });
    } else {
      throw new BadRequestError();
    }
  }
);

export { router as memoryRouter };