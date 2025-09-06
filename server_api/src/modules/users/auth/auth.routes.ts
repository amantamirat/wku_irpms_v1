import { Router } from 'express';
import { AuthController } from './auth.controller';
import authController from '../../../controllers/authController';
import { authenticateToken } from '../../../middleware/auth';

const router: Router = Router();

router.post("/", AuthController.logInUser);
router.post("/send-reset-code", authController.sendResetCode);
router.post("/reset-password", authController.resetPassword);
router.post("/send-activation-code", authenticateToken, authController.sendActivationCode);
router.post("/activate-account", authenticateToken, authController.activateAccount);
export default router;