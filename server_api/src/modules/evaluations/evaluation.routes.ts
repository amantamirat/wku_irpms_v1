import { Router } from "express";
import { EvaluationController } from "./evaluation.controller";
import { PERMISSIONS } from "../../util/permissions";
import { verifyActiveAccount, checkPermission } from "../users/user.middleware";


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
  EvaluationController.createEvaluation
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
  EvaluationController.getEvaluations
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
  EvaluationController.updateEvaluation
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
  EvaluationController.deleteEvaluation
);

export default router;
