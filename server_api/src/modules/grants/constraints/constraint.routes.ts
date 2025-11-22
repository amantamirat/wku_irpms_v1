import { Router } from 'express';
import { ConstraintController } from './constraint.controller';
import { checkPermission, verifyActiveAccount } from '../../users/auth/auth.middleware';
import { PERMISSIONS } from '../../../util/permissions';


const router: Router = Router();

router.post('/', verifyActiveAccount,
    checkPermission([PERMISSIONS.CONSTRAINT.CREATE]),
    ConstraintController.createConstraint);
router.get('/', verifyActiveAccount, checkPermission([
    PERMISSIONS.CONSTRAINT.READ
]), ConstraintController.getConstraints);
router.put('/:id', verifyActiveAccount,
    checkPermission([PERMISSIONS.CONSTRAINT.UPDATE]),
    ConstraintController.updateProjectConstraint);
router.delete('/:id', verifyActiveAccount, 
    checkPermission([PERMISSIONS.CONSTRAINT.DELETE]), 
    ConstraintController.deleteConstraint);

export default router;
