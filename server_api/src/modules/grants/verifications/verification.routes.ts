import { Router } from "express";
import {
    verifyActiveAccount
} from "../../auth/auth.middleware";

import { VerificationController } from "./verification.controller";
import { VerificationService } from "./verification.serive";
import { notificationService, projectRepo, verificationConfRepo, verificationRepo } from "../../../core/container";
import { upload } from "../../../util/multer";

const verificationService =
    new VerificationService(
        verificationRepo,
        verificationConfRepo,
        projectRepo,
        notificationService,
    );

const verificationController =
    new VerificationController(
        verificationService
    );

const router = Router();


// Create / submit verification
router.post(
    "/",
    verifyActiveAccount,
    //checkPermission("verification:create"),

    (req, res, next) => {
        req.headers["x-upload-folder"] = "verifications";
        next();
    },

    upload.single("document"),

    verificationController.create
);


// Get verifications by configuration
router.get(
    "/configuration/:configurationId",
    verifyActiveAccount,
    //checkPermission("verification:read"),
    verificationController.getByConfiguration
);


// Get verifications by project
router.get(
    "/project/:projectId",
    verifyActiveAccount,
    //checkPermission("verification:read"),
    verificationController.getByProject
);


// Get verification by ID
router.get(
    "/:id",
    verifyActiveAccount,
    //checkPermission("verification:read"),
    verificationController.getById
);

export default router;