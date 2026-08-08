import { Router } from "express";

import { ProfileService } from "./profile.service";
import { profileRepo } from "../../../core/container";
import { ProfileController } from "./profile.controller";
import { checkPermission, verifyActiveAccount } from "../../auth/auth.middleware";
import { PERMISSIONS } from "../../../common/constants/permissions";

const service = new ProfileService(profileRepo);
const controller = new ProfileController(service);

const router: Router = Router();

//----------------------------------------
// CREATE COMPOSITION
//----------------------------------------
router.post(
    "/",
    verifyActiveAccount,
    checkPermission([PERMISSIONS.COMPOSITION.CREATE]),
    controller.create
);


router.get(
    "/:id",
    verifyActiveAccount,
    checkPermission([PERMISSIONS.COMPOSITION.READ]),
    controller.getById
);

//----------------------------------------
// GET 
//----------------------------------------
router.get(
    "/",
    verifyActiveAccount,
    checkPermission([PERMISSIONS.COMPOSITION.READ]),
    controller.get
);

//----------------------------------------
// UPDATE 
//----------------------------------------
router.put(
    "/:id",
    verifyActiveAccount,
    checkPermission([PERMISSIONS.COMPOSITION.UPDATE]),
    controller.update
);

//----------------------------------------
// DELETE COMPOSITION
//----------------------------------------
router.delete(
    "/:id",
    verifyActiveAccount,
    checkPermission([PERMISSIONS.COMPOSITION.DELETE]),
    controller.delete
);

export default router;
