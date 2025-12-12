import { Router } from "express";
import { OptionController } from "./option.controller";
import { verifyActiveAccount, checkPermission } from "../../../users/user.middleware";
import { PERMISSIONS } from "../../../../util/permissions";

const controller = new OptionController();
const router = Router();

// Create a new option under a criterion
router.post(
    "/",
    verifyActiveAccount,
    checkPermission([PERMISSIONS.EVALUATION.CREATE]),
    controller.create
);

// Get all options under a criterion
router.get(
    "/",
    verifyActiveAccount,
    checkPermission([PERMISSIONS.EVALUATION.READ]),
    controller.getOptions
);

// Update an option
router.put(
    "/:id",
    verifyActiveAccount,
    checkPermission([PERMISSIONS.EVALUATION.UPDATE]),
    controller.update
);

// Delete an option
router.delete(
    "/:id",
    verifyActiveAccount,
    checkPermission([PERMISSIONS.EVALUATION.DELETE]),
    controller.delete
);

export default router;
