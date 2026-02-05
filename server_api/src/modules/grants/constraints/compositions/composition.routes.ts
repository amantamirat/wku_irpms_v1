import { Router } from "express";
import { CompositionController } from "./composition.controller";
import { CompositionService } from "./composition.service";
import { checkPermission, verifyActiveAccount } from "../../../users/user.middleware";
import { PERMISSIONS } from "../../../../common/constants/permissions";

const service = new CompositionService();
const controller = new CompositionController(service);

const router: Router = Router();

//----------------------------------------
// CREATE COMPOSITION
//----------------------------------------
router.post(
    "/",
    verifyActiveAccount,
    checkPermission([PERMISSIONS.CONSTRAINT.CREATE]),
    controller.create
);

//----------------------------------------
// GET COMPOSITIONS
//----------------------------------------
router.get(
    "/",
    verifyActiveAccount,
    checkPermission([PERMISSIONS.CONSTRAINT.READ]),
    controller.get
);

//----------------------------------------
// UPDATE COMPOSITION
//----------------------------------------
router.put(
    "/:id",
    verifyActiveAccount,
    checkPermission([PERMISSIONS.CONSTRAINT.UPDATE]),
    controller.update
);

//----------------------------------------
// DELETE COMPOSITION
//----------------------------------------
router.delete(
    "/:id",
    verifyActiveAccount,
    checkPermission([PERMISSIONS.CONSTRAINT.DELETE]),
    controller.delete
);

export default router;
