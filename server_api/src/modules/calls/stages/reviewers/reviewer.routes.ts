import { Router } from 'express';
import { ReviewerController } from './reviewer.controller';
import { checkPermission, checkStatusPermission, verifyActiveAccount } from '../../../users/user.middleware';
import { PERMISSIONS } from '../../../../common/constants/permissions';

const controller = new ReviewerController();
const router: Router = Router();

router.post('/', verifyActiveAccount,
    checkPermission([PERMISSIONS.REVIEWER.CREATE]),
    controller.create);
router.get('/', verifyActiveAccount,
    checkPermission([PERMISSIONS.REVIEWER.READ]),
    controller.get);
router.put('/:id', verifyActiveAccount,
    checkPermission([PERMISSIONS.REVIEWER.UPDATE]),
    controller.update);

router.patch('/:id', verifyActiveAccount,
    checkStatusPermission("reviewer"),
    controller.updateStatus);
router.delete('/:id', verifyActiveAccount,
    checkPermission([PERMISSIONS.REVIEWER.DELETE]),
    controller.delete);

export default router;
