import { Router } from 'express';
import { ThematicController } from './thematic.controller';
import { PERMISSIONS } from '../../common/constants/permissions';
import { verifyActiveAccount, checkPermission } from '../users/user.middleware';

const controller = new ThematicController();

const router: Router = Router();

router.post(
    '/',
    verifyActiveAccount,
    checkPermission([PERMISSIONS.THEME.CREATE]),
    controller.create
);

router.get(
    '/',
    verifyActiveAccount,
    checkPermission([PERMISSIONS.THEME.READ]),
    controller.get
);

router.put(
    '/:id',
    verifyActiveAccount,
    checkPermission([PERMISSIONS.THEME.UPDATE]),
    controller.update
);

router.delete(
    '/:id',
    verifyActiveAccount,
    checkPermission([PERMISSIONS.THEME.DELETE]),
    controller.delete
);

export default router;
