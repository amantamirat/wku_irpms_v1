import { Router } from "express";
import { checkTransitionPermission, verificationConfRepo, verificationRepo } from "../../../core/container";
import { verifyAuthToken } from "../../auth/auth.middleware";
import { checkPermission } from '../../../core/container';
import { VerificationConfigurationController } from "./verification-conf.controller";
import { VerificationConfigurationService } from "./verification-conf.service";

const verificationConfService =
    new VerificationConfigurationService(
        verificationConfRepo, verificationRepo
    );

const controller =
    new VerificationConfigurationController(
        verificationConfService
    );

const router = Router();

router.post(
    '/',
    verifyAuthToken,
    checkPermission("verification-conf:create"),
    controller.create
);

router.get(
    '/lookup',
    verifyAuthToken,
    checkPermission("verification-conf:lookup"),
    controller.get
);

router.get(
    '/',
    verifyAuthToken,
    checkPermission("verification-conf:read"),
    controller.get
);

router.get(
    "/upcoming",
    verifyAuthToken,
    //checkPermission("verification-conf:read"),
    controller.getUpcoming
);

router.get(
    '/:id',
    verifyAuthToken,
    checkPermission("verification-conf:lookup"),
    controller.getById
);

router.put(
    '/:id',
    verifyAuthToken,
    checkPermission("verification-conf:update"),
    controller.update
);

// Update status
router.patch(
    '/:id/transition', // Often better to have a specific sub-route for transitions
    verifyAuthToken,
    checkTransitionPermission("verification-conf"),
    controller.transitionState
);

router.delete(
    '/:id',
    verifyAuthToken,
    checkPermission("verification-conf:delete"),
    controller.delete
);

export default router;