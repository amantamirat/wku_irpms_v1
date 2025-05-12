import { Router } from 'express';
import authController from '../controllers/authController';
import { authenticateToken } from '../middleware/auth';

const router: Router = Router();

router.post("/", authController.loginUser);
router.post("/send-reset-code", authController.sendResetCode);
router.post("/reset-password", authController.resetPassword);
router.post("/send-activation-code", authenticateToken, authController.sendActivationCode);
router.post("/activate-account", authenticateToken, authController.activateAccount);
export default router;