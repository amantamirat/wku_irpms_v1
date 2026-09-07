import express from "express";
import { applicationService, checkPermission, checkTransitionPermission } from "../../../core/container";
import { upload } from "../../../util/multer";
import { verifyActiveAccount } from "../../auth/auth.middleware";
import { ApplicationController } from "./application.controller";

const controller = new ApplicationController(applicationService);
const router = express.Router();

router.post(
    "/",
    verifyActiveAccount,
    checkPermission("application:create"),
    (req, res, next) => {
        // Set the dynamic subfolder for this specific endpoint
        req.headers["x-upload-folder"] = "applications";
        next();
    },
    upload.single("document"),
    controller.create
);

router.post(
    "/apply",
    verifyActiveAccount,
    checkPermission("application:apply"),
    (req, res, next) => {
        // Set the dynamic subfolder for this specific endpoint
        req.headers["x-upload-folder"] = "applications";
        next();
    },
    upload.single("file"),
    controller.apply
);

router.get(
    "/",
    verifyActiveAccount,
    checkPermission("application:read"),
    controller.get
);

//used the same get function
router.get(
    "/lookup",
    verifyActiveAccount,
    checkPermission("application:lookup"),
    controller.get
);

router.get(
    "/:id",
    verifyActiveAccount,
    checkPermission("application:read"),
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
    verifyActiveAccount,
    //checkPermission("application:anonymize"),
    checkPermission("application:calculateTotalScore"),
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
    verifyActiveAccount,
    checkTransitionPermission("application"),
    controller.transitionState
);

router.delete(
    "/:id",
    verifyActiveAccount,
    checkPermission("application:delete"),
    controller.delete
);

router.post(
    "/:id/withdraw",
    verifyActiveAccount,
    checkPermission("application:withdraw"),
    controller.withdraw
);

export default router;
