import { Router } from 'express';
import authController from '../controllers/authController';

const router: Router = Router();

router.post("/", authController.loginUser);
router.post("/send-reset-code", authController.sendResetCode);
router.post("/reset-password", authController.resetPassword);
export default router;