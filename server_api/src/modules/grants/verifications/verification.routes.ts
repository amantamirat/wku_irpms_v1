import { Router } from "express";
import { VerificationController } from "./verification.controller";
import { VerificationService } from "./verification.service";
import { verifyActiveAccount, checkPermission } from "../../auth/auth.middleware";
import { GrantRepository } from "../grant.repository";
import { VerificationRepository } from "./verification.repo";


// Repositories
const verificationRepo = new VerificationRepository();
const grantRepo = new GrantRepository();

// Services
const verificationService = new VerificationService(
    verificationRepo,
    grantRepo
);

// Controller
const controller = new VerificationController(
    verificationService
);

// Router
const router: Router = Router();

router.post(
    '/',
    verifyActiveAccount,
    checkPermission("verification:create"),
    controller.create
);

router.get(
    '/',
    verifyActiveAccount,
    checkPermission("verification:read"),
    controller.findAll
);

router.get(
    '/:id',
    verifyActiveAccount,
    checkPermission("verification:read"),
    controller.findById
);

router.put(
    '/:id',
    verifyActiveAccount,
    checkPermission("verification:update"),
    controller.update
);

router.delete(
    '/:id',
    verifyActiveAccount,
    checkPermission("verification:delete"),
    controller.delete
);

export default router;