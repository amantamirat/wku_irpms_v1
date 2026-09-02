import { Router } from "express";
import { verificationConfRepo } from "../../../core/container";
import { checkPermission, verifyActiveAccount } from "../../auth/auth.middleware";
import { VerificationConfigurationController } from "./verification-conf.controller";
import { VerificationConfigurationService } from "./verification-conf.service";

const verificationConfService =
    new VerificationConfigurationService(
        verificationConfRepo
    );

const verificationConfController =
    new VerificationConfigurationController(
        verificationConfService
    );

const router = Router();

router.post(
    '/',
    verifyActiveAccount,
    checkPermission("verification-conf:create"),
    verificationConfController.create
);

router.get(
    '/',
    verifyActiveAccount,
    checkPermission("verification-conf:read"),
    verificationConfController.getAll
);

router.get(
    "/upcoming",
    verifyActiveAccount,
    //checkPermission("verification-conf:read"),
    verificationConfController.getUpcoming
);

router.get(
    '/:id',
    verifyActiveAccount,
    checkPermission("verification-conf:read"),
    verificationConfController.getById
);

router.put(
    '/:id',
    verifyActiveAccount,
    checkPermission("verification-conf:update"),
    verificationConfController.update
);

router.delete(
    '/:id',
    verifyActiveAccount,
    checkPermission("verification-conf:delete"),
    verificationConfController.delete
);

export default router;