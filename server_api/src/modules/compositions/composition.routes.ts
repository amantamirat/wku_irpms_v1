import { Router } from "express";

import { CompositionService } from "./composition.service";
import { CompositionController } from "./composition.controller";

import { verifyAuthToken } from "../auth/auth.middleware";
import { checkPermission, compositionRepo } from "../../core/container";
import { PERMISSIONS } from "../../common/constants/permissions";

const service = new CompositionService(compositionRepo);
const controller = new CompositionController(service);

const router: Router = Router();

//----------------------------------------
// CREATE COMPOSITION
//----------------------------------------

router.post(
    "/",
    verifyAuthToken,
    checkPermission([PERMISSIONS.COMPOSITION.CREATE]),
    controller.create
);

//----------------------------------------
// GET COMPOSITIONS
//----------------------------------------

router.get(
    "/",
    verifyAuthToken,
    checkPermission([PERMISSIONS.COMPOSITION.READ]),
    controller.get
);

//----------------------------------------
// LOOKUP COMPOSITIONS
//----------------------------------------

router.get(
    "/lookup",
    verifyAuthToken,
    checkPermission([PERMISSIONS.COMPOSITION.LOOKUP]),
    controller.get
);

//----------------------------------------
// GET COMPOSITION BY ID
//----------------------------------------

router.get(
    "/:id",
    verifyAuthToken,
    checkPermission([PERMISSIONS.COMPOSITION.LOOKUP]),
    controller.getById
);

//----------------------------------------
// UPDATE COMPOSITION
//----------------------------------------

router.put(
    "/:id",
    verifyAuthToken,
    checkPermission([PERMISSIONS.COMPOSITION.UPDATE]),
    controller.update
);

//----------------------------------------
// DELETE COMPOSITION
//----------------------------------------

router.delete(
    "/:id",
    verifyAuthToken,
    checkPermission([PERMISSIONS.COMPOSITION.DELETE]),
    controller.delete
);

export default router;