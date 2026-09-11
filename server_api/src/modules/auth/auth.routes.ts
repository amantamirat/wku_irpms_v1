import { Router } from "express";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { verifyAuthToken } from "./auth.middleware";
import { accountRepo, settingService, userRepo } from "../../core/container";


const router = Router();
const service = new AuthService(accountRepo, userRepo, settingService);
const controller = new AuthController(service);

router.post("/login", controller.login);
router.post("/send-code", controller.sendVerificationCode);
router.post("/reset-password", controller.resetPassword);
router.post("/activate", controller.activate);
router.post("/change-password", verifyAuthToken, controller.changePassword);


export default router;