import { Router } from "express";

import { PERMISSIONS } from "../../../../common/constants/permissions";

import {
    checkPermission,
    checkTransitionPermission,
    phaseActivityService
} from "../../../../core/container";

import { verifyAuthToken } from "../../../auth/auth.middleware";

import { PhaseActivityController } from "./phase-activity.controller";

const controller = new PhaseActivityController(
    phaseActivityService
);

const router: Router = Router();


// ---------------------------------------------------
// Create
// ---------------------------------------------------

router.post(
    "/",
    verifyAuthToken,
    checkPermission([
        PERMISSIONS.PHASE_ACTIVITY.CREATE,
        PERMISSIONS.PHASE_ACTIVITY.CREATE_OWN,
    ]),
    controller.create
);


// ---------------------------------------------------
// Get
// ---------------------------------------------------

router.get(
    "/",
    verifyAuthToken,
    checkPermission(
        PERMISSIONS.PHASE_ACTIVITY.READ
    ),
    controller.get
);


// ---------------------------------------------------
// Lookup
// ---------------------------------------------------

router.get(
    "/lookup",
    verifyAuthToken,
    checkPermission(
        PERMISSIONS.PHASE_ACTIVITY.LOOKUP
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
        PERMISSIONS.PHASE_ACTIVITY.UPDATE,
        PERMISSIONS.PHASE_ACTIVITY.UPDATE_OWN,
    ]),
    controller.update
);


// ---------------------------------------------------
// Transition
// ---------------------------------------------------

router.patch(
    "/:id",
    verifyAuthToken,
    checkTransitionPermission(
        "phaseActivity"
    ),
    controller.transitionState
);


// ---------------------------------------------------
// Delete
// ---------------------------------------------------

router.delete(
    "/:id",
    verifyAuthToken,
    checkPermission([
        PERMISSIONS.PHASE_ACTIVITY.DELETE,
        PERMISSIONS.PHASE_ACTIVITY.DELETE_OWN,
    ]),
    controller.delete
);


export default router;