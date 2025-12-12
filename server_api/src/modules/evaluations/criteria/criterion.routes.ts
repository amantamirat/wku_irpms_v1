import { Router } from "express";
import { PERMISSIONS } from "../../../common/constants/permissions";
import { checkPermission, verifyActiveAccount } from "../../users/user.middleware";
import { CriterionController } from "./criterion.controller";

const controller = new CriterionController();
const router = Router();

// Create a single criterion
router.post(
    "/",
    verifyActiveAccount,
    checkPermission([PERMISSIONS.EVALUATION.CREATE]),
    controller.create
);

// Get all criteria for an evaluation
router.get(
    "/",
    verifyActiveAccount,
    //checkPermission([PERMISSIONS.EVALUATION.READ]),
    controller.getCriteria
);

// Update a criterion
router.put(
    "/:id",
    verifyActiveAccount,
    checkPermission([PERMISSIONS.EVALUATION.UPDATE]),
    controller.update
);

// Delete a criterion
router.delete(
    "/:id",
    verifyActiveAccount,
    checkPermission([PERMISSIONS.EVALUATION.DELETE]),
    controller.delete
);

// Batch import criteria with options
router.post(
    "/import-batch",
    verifyActiveAccount,
    checkPermission([PERMISSIONS.EVALUATION.CREATE]),
    CriterionController.importCriteriaBatch
);

export default router;
