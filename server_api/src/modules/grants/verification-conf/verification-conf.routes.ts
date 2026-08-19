import { Router } from "express";
import { checkPermission, verifyActiveAccount } from "../../auth/auth.middleware";
import { VerificationConfigurationController } from "./verification-conf.controller";
import { VerificationConfigurationRepository } from "./verification-conf.repository";
import { VerificationConfigurationService } from "./verification-conf.service";

const verificationConfRepo =
    new VerificationConfigurationRepository();

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
    //checkPermission("verification-conf:create"),
    verificationConfController.create
);

router.get(
    '/',
    verifyActiveAccount,
    //checkPermission("verification-conf:read"),
    verificationConfController.getAll
);

/*
//put the grant route first than id route
router.get(
    '/',
    verifyActiveAccount,
    //checkPermission("verification-conf:read"),
    verificationConfController.getByGrant
);*/

router.get(
    '/:id',
    verifyActiveAccount,
    //checkPermission("verification-conf:read"),
    verificationConfController.getById
);

router.put(
    '/:id',
    verifyActiveAccount,
    //checkPermission("verification-conf:update"),
    verificationConfController.update
);

router.delete(
    '/:id',
    verifyActiveAccount,
    //checkPermission("verification-conf:delete"),
    verificationConfController.delete
);

export default router;