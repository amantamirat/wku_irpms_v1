import { Router } from "express";
import { OptionController } from "./option.controller";
import { verifyActiveAccount, checkPermission } from "../../users/auth/auth.middleware";
import { PERMISSIONS } from "../../../util/permissions";

const router = Router();

// Create a new option under a criterion
router.post(
    "/",
    verifyActiveAccount,
    checkPermission([PERMISSIONS.EVALUATION.CREATE]),
    OptionController.createOption
);

// Get all options under a criterion
router.get(
    "/",
    verifyActiveAccount,
    checkPermission([PERMISSIONS.EVALUATION.READ]),
    OptionController.getOptions
);

// Update an option
router.put(
    "/:id",
    verifyActiveAccount,
    checkPermission([PERMISSIONS.EVALUATION.UPDATE]),
    OptionController.updateOption
);

// Delete an option
router.delete(
    "/:id",
    verifyActiveAccount,
    checkPermission([PERMISSIONS.EVALUATION.DELETE]),
    OptionController.deleteOption
);

export default router;
