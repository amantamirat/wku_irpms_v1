import { Router } from "express";

import { ConstraintController } from "./constraint.controller";
import { ConstraintService } from "./constraint.service";

import { verifyAuthToken } from "../auth/auth.middleware";
import {
    checkPermission,
    constraintRepo,
} from "../../core/container";

import { PERMISSIONS } from "../../common/constants/permissions";

const service = new ConstraintService(constraintRepo);
const controller = new ConstraintController(service);

const router: Router = Router();

//----------------------------------------
// CREATE CONSTRAINT
//----------------------------------------

router.post(
    "/",
    verifyAuthToken,
    checkPermission([PERMISSIONS.CONSTRAINT.CREATE]),
    controller.create
);

//----------------------------------------
// GET CONSTRAINTS
//----------------------------------------

router.get(
    "/",
    verifyAuthToken,
    checkPermission([PERMISSIONS.CONSTRAINT.READ]),
    controller.get
);

//----------------------------------------
// LOOKUP CONSTRAINTS
//----------------------------------------

router.get(
    "/lookup",
    verifyAuthToken,
    checkPermission([PERMISSIONS.CONSTRAINT.LOOKUP]),
    controller.get
);

//----------------------------------------
// GET CONSTRAINT BY ID
//----------------------------------------

router.get(
    "/:id",
    verifyAuthToken,
    checkPermission([PERMISSIONS.CONSTRAINT.LOOKUP]),
    controller.getById
);

//----------------------------------------
// UPDATE CONSTRAINT
//----------------------------------------

router.put(
    "/:id",
    verifyAuthToken,
    checkPermission([PERMISSIONS.CONSTRAINT.UPDATE]),
    controller.update
);

//----------------------------------------
// DELETE CONSTRAINT
//----------------------------------------

router.delete(
    "/:id",
    verifyAuthToken,
    checkPermission([PERMISSIONS.CONSTRAINT.DELETE]),
    controller.delete
);

export default router;