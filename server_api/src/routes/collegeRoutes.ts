import { Router } from 'express';
import collegeController from '../controllers/collegeController';
const router: Router = Router();
import { verifyActiveAccount } from "../middleware/auth";

router.post('/', verifyActiveAccount, collegeController.createCollege);
router.get('/', verifyActiveAccount, collegeController.getAllColleges);
router.put('/:id', verifyActiveAccount, collegeController.updateCollege);
router.delete('/:id', verifyActiveAccount, collegeController.deleteCollege);

export default router;
