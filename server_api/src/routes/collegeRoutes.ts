import { Router } from 'express';
import collegeController from '../controllers/collegeController'; 
const router: Router = Router();

router.post('/', collegeController.createCollege);
router.get('/', collegeController.getAllColleges);
router.get('/:id', collegeController.getCollegeById);
router.put('/:id', collegeController.updateCollege);
router.delete('/:id', collegeController.deleteCollege);

export default router;
