import { Router } from "express";
import { EvaluationController } from "./evaluation.controller";
import { PERMISSIONS } from "../../util/permissions";
import { verifyActiveAccount, checkPermission } from "../users/user.middleware";

const controller = new EvaluationController();
const router = Router();

/**
 * @route POST /evaluations
 * @desc Create a new evaluation
 * @access Protected
 */
router.post(
  "/",
  verifyActiveAccount,
  checkPermission([PERMISSIONS.EVALUATION.CREATE]),
  controller.create
);

/**
 * @route GET /evaluations
 * @desc Get evaluations (optionally by directorateId)
 * @access Protected
 */
router.get(
  "/",
  verifyActiveAccount,
  checkPermission([PERMISSIONS.EVALUATION.READ]),
  controller.getEvaluations
);

/*
router.get(
  '/user',
  verifyActiveAccount,
  checkPermission([
    PERMISSIONS.EVALUATION.READ,
    PERMISSIONS.EVALUATION.UPDATE,
    PERMISSIONS.EVALUATION.DELETE
  ]),
  EvaluationController.getUserEvaluations
);
*/
/**
 * @route PUT /evaluations/:id
 * @desc Update an existing evaluation
 * @access Protected
 */
router.put(
  "/:id",
  verifyActiveAccount,
  checkPermission([PERMISSIONS.EVALUATION.UPDATE]),
  controller.update
);

/**
 * @route DELETE /evaluations/:id
 * @desc Delete an evaluation
 * @access Protected
 */
router.delete(
  "/:id",
  verifyActiveAccount,
  checkPermission([PERMISSIONS.EVALUATION.DELETE]),
  controller.delete
);

export default router;
