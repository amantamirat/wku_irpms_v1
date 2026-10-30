import { Router } from "express";
import { PERMISSIONS } from "../../../common/constants/permissions";

import {
    componentRepo,
    userRepo,
    projectAuth,
    checkPermission,
} from "../../../core/container";

import { verifyAuthToken } from "../../auth/auth.middleware";
import { ProjectComponentController } from "./component.controller";
import { ProjectComponentService } from "./component.service";

const controller = new ProjectComponentController(
    new ProjectComponentService(
        componentRepo,
        userRepo,
        projectAuth
    )
);

const router: Router = Router();


// ---------------------------------------------------
// Create
// ---------------------------------------------------

router.post(
    "/",
    verifyAuthToken,
    checkPermission([
        PERMISSIONS.PROJECT_COMPONENT.CREATE,
        PERMISSIONS.PROJECT_COMPONENT.CREATE_OWN,
    ]),
    controller.create
);


// ---------------------------------------------------
// Get
// ---------------------------------------------------

router.get(
    "/",
    verifyAuthToken,
    checkPermission([
        PERMISSIONS.PROJECT_COMPONENT.READ,
    ]),
    controller.get
);


// ---------------------------------------------------
// Lookup
// ---------------------------------------------------

router.get(
    "/lookup",
    verifyAuthToken,
    checkPermission(
        PERMISSIONS.PROJECT_COMPONENT.LOOKUP
    ),
    controller.get
);


// ---------------------------------------------------
// Update
// ---------------------------------------------------

router.put(
    "/:id",
    verifyAuthToken,
    checkPermission([
        PERMISSIONS.PROJECT_COMPONENT.UPDATE,
        PERMISSIONS.PROJECT_COMPONENT.UPDATE_OWN,
    ]),
    controller.update
);


// ---------------------------------------------------
// Delete
// ---------------------------------------------------

router.delete(
    "/:id",
    verifyAuthToken,
    checkPermission([
        PERMISSIONS.PROJECT_COMPONENT.DELETE,
        PERMISSIONS.PROJECT_COMPONENT.DELETE_OWN,
    ]),
    controller.delete
);


export default router;