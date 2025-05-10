import { Router } from 'express';
import specializationController from '../controllers/specializationController';
const router: Router = Router();
import { verifyActiveAccount } from "../middleware/auth";

router.post('/', verifyActiveAccount, specializationController.createSpecialization);
router.get('/', verifyActiveAccount, specializationController.getAllSpecializations);
router.put('/:id', verifyActiveAccount, specializationController.updateSpecialization);
router.delete('/:id', verifyActiveAccount, specializationController.deleteSpecialization);

export default router;
