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
    checkPermission([PERMISSIONS.APPLICATION.CREATE, PERMISSIONS.APPLICATION.SUBMIT]),
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

// My assigned applications
router.get(
    "/my-assigned",
    verifyAuthToken,
    checkPermission("application:assigned:read"),
    controller.getMyAssignedApplications
);

router.get(
    "/lookup",
    verifyAuthToken,
    checkPermission("application:lookup"),
    controller.lookup
);

router.get(
    "/:id",
    verifyAuthToken,
    checkPermission("application:lookup"),
    controller.getById
);



router.post(
    "/:id/anonymize",
    verifyAuthToken,
    checkPermission("application:anonymize"),
    controller.anonymize
);


router.patch(
    "/:id/reviewer-assigner",
    verifyAuthToken,
    checkPermission("application:reviewerAssigner:update"),
    controller.updateReviewerAssigner
);

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


export default router;
