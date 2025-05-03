import { Router } from 'express';
import authController from '../controllers/authController';

const router: Router = Router();

router.post("/", authController.loginUser);

export default router;