import express from "express";
import { applicationService, checkPermission, checkTransitionPermission } from "../../../core/container";
import { upload } from "../../../util/multer";
import { verifyAuthToken } from "../../auth/auth.middleware";
import { ApplicationController } from "./application.controller";
import { PERMISSIONS } from "../../../common/constants/permissions";

const controller = new ApplicationController(applicationService);
const router = express.Router();

router.post(
    "/",
    verifyAuthToken,
    checkPermission([PERMISSIONS.APPLICATION.CREATE, PERMISSIONS.APPLICATION.CREATE_OWN]),
    (req, res, next) => {
        // Set the dynamic subfolder for this specific endpoint
        req.headers["x-upload-folder"] = "applications";
        next();
    },
    upload.single("document"),
    controller.create
);

/*
router.post(
    "/apply",
    verifyAuthToken,
    checkPermission("application:apply"),
    (req, res, next) => {
        // Set the dynamic subfolder for this specific endpoint
        req.headers["x-upload-folder"] = "applications";
        next();
    },
    upload.single("file"),
    controller.apply
);
*/
router.get(
    "/",
    verifyAuthToken,
    checkPermission("application:read"),
    controller.get
);

//used the same get function
router.get(
    "/lookup",
    verifyAuthToken,
    checkPermission("application:lookup"),
    controller.get
);

router.get(
    "/:id",
    verifyAuthToken,
    checkPermission("application:lookup"),
    controller.getById
);

/*
router.post(
    "/:id/calculate-score",
    verifyActiveAccount,
    checkPermission("application:calculateTotalScore"),
    controller.calculateTotalScore
);
*/

router.post(
    "/:id/anonymize",
    verifyAuthToken,
    checkPermission("application:anonymize"),
    //checkPermission("application:calculateTotalScore"),
    controller.anonymize
);

/*
router.patch(
    "/",
    verifyActiveAccount,
    checkStatusPermission("document"),
    controller.updateStatus
);
*/

router.patch(
    "/:id/transition",
    verifyAuthToken,
    checkTransitionPermission("application"),
    controller.transitionState
);

router.delete(
    "/:id",
    verifyAuthToken,
    checkPermission([PERMISSIONS.APPLICATION.DELETE, PERMISSIONS.APPLICATION.DELETE_OWN]),
    controller.delete
);

/*
router.post(
    "/:id/withdraw",
    verifyAuthToken,
    checkPermission("application:withdraw"),
    controller.withdraw
);
*/
export default router;
