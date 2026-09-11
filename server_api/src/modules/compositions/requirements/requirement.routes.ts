import { Router } from "express";

import { RequirementService } from "./requirement.service";
import { requirementRepo } from "../../../core/container";
import { RequirementController } from "./requirement.controller";
import { verifyAuthToken } from "../../auth/auth.middleware";
import { checkPermission } from '../../../core/container';
import { PERMISSIONS } from "../../../common/constants/permissions";

const service = new RequirementService(requirementRepo);
const controller = new RequirementController(service);

const router: Router = Router();

//----------------------------------------
// CREATE
//----------------------------------------
router.post(
    "/",
    verifyAuthToken,
    checkPermission([PERMISSIONS.COMPOSITION.CREATE]),
    controller.create
);

router.get(
    "/:id",
    verifyAuthToken,
    checkPermission([PERMISSIONS.COMPOSITION.READ]),
    controller.getById
)

//----------------------------------------
// GET 
//----------------------------------------
router.get(
    "/",
    verifyAuthToken,
    checkPermission([PERMISSIONS.COMPOSITION.READ]),
    controller.get
);

//----------------------------------------
// UPDATE 
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
