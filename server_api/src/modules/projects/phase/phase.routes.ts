import { Router } from 'express';
import { PhaseController } from './phase.controller';
import { checkPermission, checkStatusPermission, verifyActiveAccount } from '../../users/user.middleware';
import { PERMISSIONS } from '../../../common/constants/permissions';

const controller = new PhaseController();
const router: Router = Router();

router.post('/', verifyActiveAccount,
    checkPermission([PERMISSIONS.PHASE.CREATE]),
    controller.create);
router.get('/', verifyActiveAccount,
    checkPermission([PERMISSIONS.PHASE.READ]),
    controller.get);
router.put('/', verifyActiveAccount,
    checkPermission([PERMISSIONS.PHASE.UPDATE]),
    controller.update);
//update status
router.put(
    '/:status', verifyActiveAccount,
    checkStatusPermission("phase"),
    controller.updateStatus
);
router.delete('/:id', verifyActiveAccount,
    checkPermission([PERMISSIONS.PHASE.DELETE]),
    controller.delete);

export default router;
