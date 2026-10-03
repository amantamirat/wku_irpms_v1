import { Router } from "express";

import { PERMISSIONS } from "../../../../common/constants/permissions";

import {
    checkPermission,
    checkTransitionPermission,
    equipmentRepo,
    phaseRepo,
    projectAuth,
} from "../../../../core/container";

import { verifyAuthToken } from "../../../auth/auth.middleware";

import { PhaseEquipmentController } from "./phase-equipment.controller";
import { PhaseEquipmentService } from "./phase-equipment.service";

const controller = new PhaseEquipmentController(
    new PhaseEquipmentService(equipmentRepo, phaseRepo, projectAuth)
);

const router: Router = Router();


// ---------------------------------------------------
// Create
// ---------------------------------------------------

router.post(
    "/",
    verifyAuthToken,
    checkPermission([
        PERMISSIONS.PHASE_EQUIPMENT.CREATE,
        PERMISSIONS.PHASE_EQUIPMENT.CREATE_OWN,
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
        PERMISSIONS.PHASE_EQUIPMENT.READ,
        PERMISSIONS.PHASE_EQUIPMENT.LOOKUP]
    ),
    controller.get
);


// ---------------------------------------------------
// Lookup
// ---------------------------------------------------
/*
router.get(
    "/lookup",
    verifyAuthToken,
    checkPermission(
        PERMISSIONS.PHASE_EQUIPMENT.LOOKUP
    ),
    controller.get
);
*/

// ---------------------------------------------------
// Update
// ---------------------------------------------------

router.put(
    "/:id",
    verifyAuthToken,
    checkPermission([
        PERMISSIONS.PHASE_EQUIPMENT.UPDATE,
        PERMISSIONS.PHASE_EQUIPMENT.UPDATE_OWN,
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
        "phaseEquipment"
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
        PERMISSIONS.PHASE_EQUIPMENT.DELETE,
        PERMISSIONS.PHASE_EQUIPMENT.DELETE_OWN,
    ]),
    controller.delete
);


export default router;