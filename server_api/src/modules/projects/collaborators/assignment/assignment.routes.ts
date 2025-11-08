import { Router } from 'express';
import { AssignmentController } from './assignment.controller';
import { verifyActiveAccount } from '../../../users/auth/auth.middleware';


const router: Router = Router();

router.post('/', verifyActiveAccount, AssignmentController.createAssignment);
router.get('/', verifyActiveAccount, AssignmentController.getAssignments);
router.put('/:id', verifyActiveAccount, AssignmentController.updateAssignment);
router.delete('/:id', verifyActiveAccount, AssignmentController.deleteAssignment);

export default router;