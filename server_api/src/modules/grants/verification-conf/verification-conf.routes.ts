import { Router } from "express";
import { verificationConfRepo } from "../../../core/container";
import { verifyAuthToken } from "../../auth/auth.middleware";
import { checkPermission } from '../../../core/container';
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
    verifyAuthToken,
    checkPermission("verification-conf:create"),
    verificationConfController.create
);

router.get(
    '/lookup',
    verifyAuthToken,
    checkPermission("verification-conf:lookup"),
    verificationConfController.get
);

router.get(
    '/',
    verifyAuthToken,
    checkPermission("verification-conf:read"),
    verificationConfController.get
);

router.get(
    "/upcoming",
    verifyAuthToken,
    //checkPermission("verification-conf:read"),
    verificationConfController.getUpcoming
);

router.get(
    '/:id',
    verifyAuthToken,
    checkPermission("verification-conf:lookup"),
    verificationConfController.getById
);

router.put(
    '/:id',
    verifyAuthToken,
    checkPermission("verification-conf:update"),
    verificationConfController.update
);

router.delete(
    '/:id',
    verifyAuthToken,
    checkPermission("verification-conf:delete"),
    verificationConfController.delete
);

export default router;