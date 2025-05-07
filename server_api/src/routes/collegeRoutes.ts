import { Router } from 'express';
import collegeController from '../controllers/collegeController';
const router: Router = Router();
import { authenticateToken } from "../middleware/auth";

router.post('/', authenticateToken, collegeController.createCollege);
router.get('/', authenticateToken, collegeController.getAllColleges);
router.put('/:id', authenticateToken, collegeController.updateCollege);
router.delete('/:id', authenticateToken, collegeController.deleteCollege);

export default router;
