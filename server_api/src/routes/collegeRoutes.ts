import { Router } from 'express';
import collegeController from '../controllers/collegeController'; 
const router: Router = Router();

// CREATE a new college
router.post('/', collegeController.createCollege);

// READ all colleges
router.get('/', collegeController.getAllColleges);

// READ one college by ID
router.get('/:id', collegeController.getCollegeById);

// UPDATE a college by ID
router.put('/:id', collegeController.updateCollege);

// DELETE a college by ID
router.delete('/:id', collegeController.deleteCollege);

export default router;
