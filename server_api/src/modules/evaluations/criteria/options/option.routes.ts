import { Router } from "express";
import { OptionController } from "./option.controller";
import { verifyActiveAccount, checkPermission } from "../../../users/user.middleware";
import { PERMISSIONS } from "../../../../common/constants/permissions";

const controller = new OptionController();
const router = Router();

// Create a new option under a criterion
router.post(
    "/",
    verifyActiveAccount,
    checkPermission([PERMISSIONS.OPTION.CREATE]),
    controller.create
);

// Get all options under a criterion
router.get(
    "/",
    verifyActiveAccount,
    checkPermission([PERMISSIONS.OPTION.READ]),
    controller.getOptions
);

// Update an option
router.put(
    "/:id",
    verifyActiveAccount,
    checkPermission([PERMISSIONS.OPTION.UPDATE]),
    controller.update
);

// Delete an option
router.delete(
    "/:id",
    verifyActiveAccount,
    checkPermission([PERMISSIONS.OPTION.DELETE]),
    controller.delete
);

export default router;
