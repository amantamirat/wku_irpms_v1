import { Router } from 'express';
import authController from '../controllers/authController';

const router: Router = Router();

router.post("/login", authController.loginUser);

export default router;