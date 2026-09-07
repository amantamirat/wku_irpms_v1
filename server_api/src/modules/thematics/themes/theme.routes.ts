import { Router } from 'express';

import { PERMISSIONS } from '../../../common/constants/permissions';
import { verifyActiveAccount } from '../../auth/auth.middleware';
import { checkPermission } from '../../../core/container';
import { ThemeController } from './theme.controller';
import { ThemeService } from './theme.service';
import { thematicRepo, themeRepo } from '../../../core/container';

const controller = new ThemeController(
    new ThemeService(themeRepo, thematicRepo)
);

const router: Router = Router();

// Create
router.post(
    '/',
    verifyActiveAccount,
    checkPermission([PERMISSIONS.THEME.CREATE]),
    controller.create
);

// Lookup - currently uses the same get controller
router.get(
    '/lookup',
    verifyActiveAccount,
    checkPermission("theme:lookup"),
    controller.get
);

// Read / management
router.get(
    '/',
    verifyActiveAccount,
    checkPermission([PERMISSIONS.THEME.READ]),
    controller.get
);

// Update
router.put(
    '/:id',
    verifyActiveAccount,
    checkPermission([PERMISSIONS.THEME.UPDATE]),
    controller.update
);

// Delete
router.delete(
    '/:id',
    verifyActiveAccount,
    checkPermission([PERMISSIONS.THEME.DELETE]),
    controller.delete
);

export default router;