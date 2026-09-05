import { Router } from "express";
import { CompositionService } from "./composition.service";
import { CompositionController } from "./composition.controller";
import { PERMISSIONS } from "../../common/constants/permissions";
import { verifyActiveAccount } from "../auth/auth.middleware";
import { checkPermission } from '../../core/container';
import { compositionRepo } from "../../core/container";

const service = new CompositionService(compositionRepo);
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

router.get(
    "/:id",
    verifyActiveAccount,
    checkPermission([PERMISSIONS.COMPOSITION.READ]),
    controller.getById
)

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
