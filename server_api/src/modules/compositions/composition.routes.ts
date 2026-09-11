import { Router } from "express";
import { CompositionService } from "./composition.service";
import { CompositionController } from "./composition.controller";
import { PERMISSIONS } from "../../common/constants/permissions";
import { verifyAuthToken } from "../auth/auth.middleware";
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
    verifyAuthToken,
    checkPermission([PERMISSIONS.CONSTRAINT.CREATE]),
    controller.create
);

router.get(
    "/:id",
    verifyAuthToken,
    checkPermission([PERMISSIONS.COMPOSITION.READ]),
    controller.getById
)

//----------------------------------------
// GET COMPOSITIONS
//----------------------------------------
router.get(
    "/",
    verifyAuthToken,
    checkPermission([PERMISSIONS.CONSTRAINT.READ]),
    controller.get
);

//----------------------------------------
// UPDATE COMPOSITION
//----------------------------------------
router.put(
    "/:id",
    verifyAuthToken,
    checkPermission([PERMISSIONS.CONSTRAINT.UPDATE]),
    controller.update
);

//----------------------------------------
// DELETE COMPOSITION
//----------------------------------------
router.delete(
    "/:id",
    verifyAuthToken,
    checkPermission([PERMISSIONS.CONSTRAINT.DELETE]),
    controller.delete
);

export default router;
