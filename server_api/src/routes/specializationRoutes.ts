import { Router } from 'express';
import specializationController from '../controllers/specializationController';
const router: Router = Router();
import { authenticateToken } from "../middleware/auth";

router.post('/', authenticateToken, specializationController.createSpecialization);
router.get('/', authenticateToken, specializationController.getAllSpecializations);
router.put('/:id', authenticateToken, specializationController.updateSpecialization);
router.delete('/:id', authenticateToken, specializationController.deleteSpecialization);

export default router;
