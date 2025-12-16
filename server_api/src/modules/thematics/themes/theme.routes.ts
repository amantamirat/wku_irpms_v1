import { Router } from 'express';
import { PERMISSIONS } from '../../../common/constants/permissions';
import { verifyActiveAccount, checkPermission } from '../../users/user.middleware';
import { ThemeController } from './theme.controller';


const controller = new ThemeController();

const router: Router = Router();

router.post(
    '/',
    verifyActiveAccount,
    checkPermission([PERMISSIONS.THEME.CREATE]),
    controller.create
);

router.post(
    '/import',
    verifyActiveAccount,
    checkPermission([PERMISSIONS.THEME.IMPORT]),
    controller.import
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
