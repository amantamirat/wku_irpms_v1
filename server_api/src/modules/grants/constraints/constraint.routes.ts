import { Router } from 'express';
import { ConstraintController } from './constraint.controller';
import { checkPermission, verifyActiveAccount } from '../../users/auth/auth.middleware';
import { PERMISSIONS } from '../../../util/permissions';


const router: Router = Router();

router.post('/', verifyActiveAccount,
    checkPermission([PERMISSIONS.GRANT.CREATE]),
    ConstraintController.createConstraint);
router.get('/', verifyActiveAccount, checkPermission([
    PERMISSIONS.GRANT.READ
]), ConstraintController.getConstraints);
router.put('/:id', verifyActiveAccount,
    checkPermission([PERMISSIONS.GRANT.UPDATE]),
    ConstraintController.updateConstraint);
router.delete('/:id', verifyActiveAccount, 
    checkPermission([PERMISSIONS.GRANT.DELETE]), 
    ConstraintController.deleteConstraint);

export default router;
