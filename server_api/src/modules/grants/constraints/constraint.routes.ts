import { Router } from 'express';
import { ConstraintController } from './constraint.controller';
import { checkPermission, verifyActiveAccount } from '../../users/user.middleware';
import { PERMISSIONS } from '../../../common/constants/permissions';
import { ConstraintService } from './constraint.service';

const service = new ConstraintService();
const controller = new ConstraintController(service);

const router: Router = Router();

router.post('/', verifyActiveAccount,
    checkPermission([PERMISSIONS.CONSTRAINT.CREATE]),
    controller.create);
router.get('/', verifyActiveAccount, checkPermission([
    PERMISSIONS.CONSTRAINT.READ
]), controller.get);
router.put('/:id', verifyActiveAccount,
    checkPermission([PERMISSIONS.CONSTRAINT.UPDATE]),
    controller.update);
router.delete('/:id', verifyActiveAccount, 
    checkPermission([PERMISSIONS.CONSTRAINT.DELETE]), 
    controller.delete);

export default router;
