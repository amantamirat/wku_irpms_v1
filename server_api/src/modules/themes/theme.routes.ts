import { Router } from 'express';
import { ThemeController } from './theme.controller';
import { verifyActiveAccount, checkPermission } from '../users/auth/auth.middleware';
import { PERMISSIONS } from '../../util/permissions';

const router: Router = Router();

// 🟢 Create Theme
router.post(
  '/',
  verifyActiveAccount,
  checkPermission([PERMISSIONS.THEME.CREATE]),
  ThemeController.createTheme
);

// 🟢 Get All Themes
router.get(
  '/',
  verifyActiveAccount,
  checkPermission([PERMISSIONS.THEME.READ]),
  ThemeController.getThemes
);

// 🟢 Get User Themes
router.get(
  '/user',
  verifyActiveAccount,
  checkPermission([
    PERMISSIONS.THEME.CREATE,
    PERMISSIONS.THEME.UPDATE,
    PERMISSIONS.THEME.DELETE
  ]),
  ThemeController.getUserThemes
);

// 🟡 Update Theme
router.put(
  '/:id',
  verifyActiveAccount,
  checkPermission([PERMISSIONS.THEME.UPDATE]),
  ThemeController.updateTheme
);

// 🔴 Delete Theme
router.delete(
  '/:id',
  verifyActiveAccount,
  checkPermission([PERMISSIONS.THEME.DELETE]),
  ThemeController.deleteTheme
);


router.post('/import-themes', verifyActiveAccount,
  checkPermission([PERMISSIONS.THEME.CREATE]),
  ThemeController.importThemesBatch);

export default router;
