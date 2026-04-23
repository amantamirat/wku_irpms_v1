import { Router } from "express";
import { TemplateController } from "./template.controller";
import { TemplateRepository } from "./template.repository";
import { TemplateService } from "./template.service";

import {
  verifyActiveAccount,
  checkPermission,
  checkTransitionPermission
} from "../auth/auth.middleware";

const repository = new TemplateRepository();
const service = new TemplateService(repository);
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
 * @desc Get templates
 * @access Protected
 */
router.get(
  "/",
  verifyActiveAccount,
  checkPermission("template:read"),
  controller.getAll
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
 * @desc Update a template
 * @access Protected
 */
router.put(
  "/:id",
  verifyActiveAccount,
  checkPermission("template:update"),
  controller.update
);

/**
 * @route PATCH /templates/:id
 * @desc Transition template state (draft ↔ published)
 * @access Protected
 */
router.patch(
  "/:id",
  verifyActiveAccount,
  checkTransitionPermission("template"),
  controller.transitionState
);

/**
 * @route DELETE /templates/:id
 * @desc Delete a template
 * @access Protected
 */
router.delete(
  "/:id",
  verifyActiveAccount,
  checkPermission("template:delete"),
  controller.delete
);

export default router;