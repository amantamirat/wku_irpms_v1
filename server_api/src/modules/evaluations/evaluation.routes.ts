import { Router } from "express";
import { EvaluationController } from "./evaluation.controller";
import { PERMISSIONS } from "../../common/constants/permissions";
import { verifyActiveAccount, checkPermission, checkTransitionPermission } from "../auth/auth.middleware";
import { EvaluationRepository } from "./evaluation.repository";
import { EvaluationService } from "./evaluation.service";
import { CriterionRepository } from "./criteria/criterion.repository";

const repository = new EvaluationRepository();
const criterionRepo = new CriterionRepository();
const service = new EvaluationService(repository, criterionRepo);
const controller = new EvaluationController(service);
const router = Router();

/**
 * @route POST /evaluations
 * @desc Create a new evaluation
 * @access Protected
 */
router.post(
  "/",
  verifyActiveAccount,
  checkPermission("evaluation:create"),
  controller.create
);

/**
 * @route GET /evaluations
 * @desc Get evaluations
 * @access Protected
 */
router.get(
  "/",
  verifyActiveAccount,
  checkPermission("evaluation:read"),
  controller.getAll
);

/**
 * @route PUT /evaluations/:id
 * @desc Update an existing evaluation
 * @access Protected
 */
router.put(
  "/:id",
  verifyActiveAccount,
  checkPermission("evaluation:update"),
  controller.update
);

router.patch('/:id', verifyActiveAccount,
  checkTransitionPermission("evaluation"),
  controller.transitionState);

/**
 * @route DELETE /evaluations/:id
 * @desc Delete an evaluation
 * @access Protected
 */
router.delete(
  "/:id",
  verifyActiveAccount,
  checkPermission("evaluation:delete"),
  controller.delete
);

export default router;
