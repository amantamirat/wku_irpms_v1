import { Router } from "express";
import {
    verifyAuthToken
} from "../../auth/auth.middleware";
import { checkTransitionPermission, projectAuth } from '../../../core/container';
import { checkPermission } from '../../../core/container';

import { VerificationController } from "./verification.controller";
import { VerificationService } from "./verification.service";
import { notificationService, projectRepo, reviewerRepo, verificationConfRepo, verificationRepo } from "../../../core/container";
import { upload } from "../../../util/multer";
import { PERMISSIONS } from "../../../common/constants/permissions";

const verificationService =
    new VerificationService(
        verificationRepo,
        verificationConfRepo,
        projectRepo,
        reviewerRepo,
        projectAuth,
        notificationService,
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