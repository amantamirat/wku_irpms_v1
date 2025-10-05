import { Router } from 'express';
import { ConstraintController } from './constraint.controller';
import { verifyActiveAccount } from '../../users/auth/auth.middleware';


const router: Router = Router();

router.post('/', verifyActiveAccount, ConstraintController.createConstraint);
router.get('/', verifyActiveAccount, ConstraintController.getConstraints);
router.put('/:id', verifyActiveAccount, ConstraintController.updateConstraint);
router.delete('/:id', verifyActiveAccount, ConstraintController.deleteConstraint);

export default router;
