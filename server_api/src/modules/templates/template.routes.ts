import { Router } from "express";
import { TemplateController } from "./template.controller";
import { TemplateRepository } from "./template.repository";
import { TemplateService } from "./template.service";

import {
  verifyActiveAccount,
  checkPermission,
} from "../auth/auth.middleware";
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
  verifyActiveAccount,
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
  verifyActiveAccount,
  checkPermission("template:read"),
  controller.get
);


/**
 * @route GET /templates/:id
 * @desc Get template by ID
 * @access Protected
 */
router.get(
  "/:id",
  verifyActiveAccount,
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
  verifyActiveAccount,
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
  verifyActiveAccount,
  checkPermission("template:delete"),
  controller.delete
);


export default router;