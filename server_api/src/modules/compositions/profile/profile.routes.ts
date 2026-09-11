import { Router } from "express";

import { ProfileService } from "./profile.service";
import { profileRepo } from "../../../core/container";
import { ProfileController } from "./profile.controller";
import { verifyAuthToken } from "../../auth/auth.middleware";
import { checkPermission } from '../../../core/container';
import { PERMISSIONS } from "../../../common/constants/permissions";

const service = new ProfileService(profileRepo);
const controller = new ProfileController(service);

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


router.get(
    "/:id",
    verifyAuthToken,
    checkPermission([PERMISSIONS.COMPOSITION.READ]),
    controller.getById
);

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
