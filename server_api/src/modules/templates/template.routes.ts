import { Router } from "express";
import { TemplateController } from "./template.controller";
import { TemplateRepository } from "./template.repository";
import { TemplateService } from "./template.service";

import {
  verifyAuthToken,
} from "../auth/auth.middleware";
import { checkPermission } from '../../core/container';
import { templateRepo } from "../../core/container";



const service = new TemplateService(templateRepo);
const controller = new TemplateController(service);

const router = Router();


/**
 * @route POST /templates
 * @desc Create a new template
 * @access Protected
 */
router.post(
  "/",
  verifyAuthToken,
  checkPermission("template:create"),
  controller.create
);


/**
 * @route GET /templates
 * @desc Get all templates
 * @access Protected
 */
router.get(
  "/",
  verifyAuthToken,
  checkPermission("template:read"),
  controller.get
);


router.get(
  "/lookup",
  verifyAuthToken,
  checkPermission("template:lookup"),
  controller.get
);


/**
 * @route GET /templates/:id
 * @desc Get template by ID
 * @access Protected
 */
router.get(
  "/:id",
  verifyAuthToken,
  checkPermission("template:read"),
  controller.getById
);


/**
 * @route PUT /templates/:id
 * @desc Update template
 * @access Protected
 */
router.put(
  "/:id",
  verifyAuthToken,
  checkPermission("template:update"),
  controller.update
);


/**
 * @route DELETE /templates/:id
 * @desc Delete template
 * @access Protected
 */
router.delete(
  "/:id",
  verifyAuthToken,
  checkPermission("template:delete"),
  controller.delete
);


export default router;