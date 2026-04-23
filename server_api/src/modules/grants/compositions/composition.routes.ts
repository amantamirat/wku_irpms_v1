import { Router } from "express";
import { CompositionService } from "./composition.service";
import { CompositionController } from "./composition.controller";
import { PERMISSIONS } from "../../../common/constants/permissions";
import { verifyActiveAccount, checkPermission } from "../../auth/auth.middleware";

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
