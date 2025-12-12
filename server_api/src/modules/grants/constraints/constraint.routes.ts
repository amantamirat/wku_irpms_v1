import { Router } from 'express';
import { ConstraintController } from './constraint.controller';
import { checkPermission, verifyActiveAccount } from '../../users/user.middleware';
import { PERMISSIONS } from '../../../common/constants/permissions';


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
