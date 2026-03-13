import { Router } from 'express';
import { UserController } from './user.controller';
import { checkPermission, checkStatusPermission, checkTransitionPermission, verifyActiveAccount } from './user.middleware';
import { PERMISSIONS } from '../../common/constants/permissions';

const controller = new UserController();
const router: Router = Router();

router.post('/', verifyActiveAccount,
    checkPermission([PERMISSIONS.USER.CREATE]),
    controller.create);
router.get('/', verifyActiveAccount,
    checkPermission([PERMISSIONS.USER.READ])
    , controller.get);
router.put('/:id', verifyActiveAccount,
    checkPermission([PERMISSIONS.USER.UPDATE]),
    controller.update);
router.patch(
    '/:id', verifyActiveAccount,
    checkTransitionPermission("user"),
    controller.transitionState
);
router.delete('/:id', verifyActiveAccount,
    checkPermission([PERMISSIONS.USER.DELETE]),
    controller.delete);

export default router;
