import { Router } from 'express';

import { PERMISSIONS } from '../../../common/constants/permissions';
import { verifyAuthToken } from '../../auth/auth.middleware';
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
    verifyAuthToken,
    checkPermission([PERMISSIONS.THEME.CREATE]),
    controller.create
);

// Lookup - currently uses the same get controller
router.get(
    '/lookup',
    verifyAuthToken,
    checkPermission("theme:lookup"),
    controller.get
);

// Read / management
router.get(
    '/',
    verifyAuthToken,
    checkPermission([PERMISSIONS.THEME.READ]),
    controller.get
);

// Update
router.put(
    '/:id',
    verifyAuthToken,
    checkPermission([PERMISSIONS.THEME.UPDATE]),
    controller.update
);

// Delete
router.delete(
    '/:id',
    verifyAuthToken,
    checkPermission([PERMISSIONS.THEME.DELETE]),
    controller.delete
);

export default router;