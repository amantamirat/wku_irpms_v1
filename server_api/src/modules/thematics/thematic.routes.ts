import { Router } from 'express';
import { ThematicController } from './thematic.controller';
import { PERMISSIONS } from '../../common/constants/permissions';
import { verifyActiveAccount, checkPermission } from '../users/auth/auth.middleware';

const controller = new ThematicController();

const router: Router = Router();

router.post(
    '/',
    verifyActiveAccount,
    checkPermission([PERMISSIONS.THEMATIC.CREATE]),
    controller.create
);

router.get(
    '/',
    verifyActiveAccount,
    checkPermission([PERMISSIONS.THEMATIC.READ]),
    controller.get
);

router.put(
    '/:id',
    verifyActiveAccount,
    checkPermission([PERMISSIONS.THEMATIC.UPDATE]),
    controller.update
);

router.delete(
    '/:id',
    verifyActiveAccount,
    checkPermission([PERMISSIONS.THEMATIC.DELETE]),
    controller.delete
);

export default router;
