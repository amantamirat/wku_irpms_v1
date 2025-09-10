import { Router } from 'express';
import { AuthController } from './auth.controller';

const router: Router = Router();
router.post("/", AuthController.logInUser);
router.post("/send-verification-code", AuthController.sendVerificationCode);
router.post("/reset-password", AuthController.resetUser);
router.post("/activate-user", AuthController.activateUser);
export default router;