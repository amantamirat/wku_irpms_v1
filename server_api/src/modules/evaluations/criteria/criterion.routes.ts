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
    checkPermission([PERMISSIONS.CRITERION.CREATE]),
    controller.create
);

// Get all criteria for an evaluation
router.get(
    "/",
    verifyActiveAccount,
    checkPermission([PERMISSIONS.CRITERION.READ]),
    controller.getCriteria
);

// Update a criterion
router.put(
    "/:id",
    verifyActiveAccount,
    checkPermission([PERMISSIONS.CRITERION.UPDATE]),
    controller.update
);

// Delete a criterion
router.delete(
    "/:id",
    verifyActiveAccount,
    checkPermission([PERMISSIONS.CRITERION.DELETE]),
    controller.delete
);

// Batch import criteria with options
router.post(
    "/import",
    verifyActiveAccount,
    checkPermission([PERMISSIONS.CRITERION.IMPORT]),
    controller.import
);

export default router;
