import { Router } from "express";
import { checkPermission, checkTransitionPermission, fileStorageService, filterService, projectAuth } from '../../../core/container';
import {
    verifyAuthToken
} from "../../auth/auth.middleware";

import { PERMISSIONS } from "../../../common/constants/permissions";
import { upload } from "../../../common/middleware/fileUpload.middleware";
import { notificationService, projectRepo, reviewerRepo, verificationConfRepo, verificationRepo } from "../../../core/container";
import { VerificationController } from "./verification.controller";
import { VerificationService } from "./verification.service";

const verificationService =
    new VerificationService(
        verificationRepo,
        verificationConfRepo,
        projectRepo,
        reviewerRepo,
        projectAuth,
        notificationService,
        filterService,
        fileStorageService
    );

const controller =
    new VerificationController(
        verificationService
    );

const router = Router();

// Create / submit verification
router.post(
    "/",
    verifyAuthToken,
    checkPermission([PERMISSIONS.VERIFICATION.CREATE, PERMISSIONS.VERIFICATION.SUBMIT]),
    (req, res, next) => {
        req.headers["x-upload-folder"] = "verifications";
        next();
    },
    upload.single("document"),
    controller.create
);

router.get(
    "/",
    verifyAuthToken,
    checkPermission("verification:read"),
    controller.find
);

router.get(
    "/lookup",
    verifyAuthToken,
    checkPermission("verification:lookup"),
    controller.find
);

// Get verification by ID
router.get(
    "/:id",
    verifyAuthToken,
    checkPermission(PERMISSIONS.VERIFICATION.LOOKUP),
    controller.getById
);

router.patch(
    "/:id/transition",
    verifyAuthToken,
    checkTransitionPermission("verification"),
    controller.transitionState
);

router.delete(
    "/:id",
    verifyAuthToken,
    checkPermission("verification:delete"),
    controller.delete
);

export default router;