import { Router } from "express";
import { CriterionController } from "./criterion.controller";
import { verifyActiveAccount, checkPermission } from "../../users/user.middleware";
import { PERMISSIONS } from "../../../util/permissions";

const router = Router();

// Create a single criterion
router.post(
    "/",
    verifyActiveAccount,
    checkPermission([PERMISSIONS.EVALUATION.CREATE]),
    CriterionController.createCriterion
);

// Get all criteria for an evaluation
router.get(
    "/",
    verifyActiveAccount,
    //checkPermission([PERMISSIONS.EVALUATION.READ]),
    CriterionController.getCriteria
);

// Update a criterion
router.put(
    "/:id",
    verifyActiveAccount,
    checkPermission([PERMISSIONS.EVALUATION.UPDATE]),
    CriterionController.updateCriterion
);

// Delete a criterion
router.delete(
    "/:id",
    verifyActiveAccount,
    checkPermission([PERMISSIONS.EVALUATION.DELETE]),
    CriterionController.deleteCriterion
);

// Batch import criteria with options
router.post(
    "/import-batch",
    verifyActiveAccount,
    checkPermission([PERMISSIONS.EVALUATION.CREATE]),
    CriterionController.importCriteriaBatch
);

export default router;
