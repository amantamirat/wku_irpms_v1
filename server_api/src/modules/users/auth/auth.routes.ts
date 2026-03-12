import { Router } from "express";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";


const router = Router();
const service = new AuthService();
const controller = new AuthController(service);

router.post("/login", controller.login);
router.post("/send-code", controller.sendVerificationCode);
router.post("/reset-password", controller.resetPassword);
router.post("/activate", controller.activateUser);
router.post("/change-password", controller.changePassword);

export default router;