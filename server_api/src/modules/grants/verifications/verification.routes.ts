import { Router } from "express";

import {
    checkPermission,
    verifyActiveAccount
} from "../../auth/auth.middleware";

import { VerificationController } from "./verification.controller";
import { VerificationRepository } from "./verification.repository";
import { VerificationService } from "./verification.serive";

import {
    VerificationConfigurationRepository
} from "../verification-conf/verification-conf.repository";
import { projectRepo } from "../../../core/container";
import { upload } from "../../../util/multer";



const verificationRepo =
    new VerificationRepository();

const verificationConfRepo =
    new VerificationConfigurationRepository();



const verificationService =
    new VerificationService(
        verificationRepo,
        verificationConfRepo,
        projectRepo
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


// Get verification by ID
router.get(
    "/:id",
    verifyActiveAccount,
    //checkPermission("verification:read"),
    verificationController.getById
);

export default router;