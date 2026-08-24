import { Router } from "express";
import {
    checkPermission,
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

const controller =
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

    controller.create
);


// Get verifications by configuration
router.get(
    "/configuration/:configurationId",
    verifyActiveAccount,
    //checkPermission("verification:read"),
    controller.getByConfiguration
);


// Get verifications by project
router.get(
    "/project/:projectId",
    verifyActiveAccount,
    //checkPermission("verification:read"),
    controller.getByProject
);


// Get verification by ID
router.get(
    "/:id",
    verifyActiveAccount,
    //checkPermission("verification:read"),
    controller.getById
);

router.delete(
    "/:id",
    verifyActiveAccount,
    checkPermission("verification:delete"),
    controller.delete
);

export default router;