import { Router } from 'express';
import { PERMISSIONS } from '../../../common/constants/permissions';
import { verifyActiveAccount, checkPermission } from '../../auth/auth.middleware';
import { ThemeController } from './theme.controller';
import { ThemeService } from './theme.service';
import { ThemeRepository } from './theme.repository';
import { ThematicRepository } from '../thematic.repository';
import { SettingService } from '../../settings/setting.service';
import { SettingRepository } from '../../settings/setting.repository';
import { upload } from '../../../util/multer';

const controller = new ThemeController(new ThemeService(
    new ThemeRepository(), new ThematicRepository(),
    new SettingService(new SettingRepository())));

const router: Router = Router();

router.post(
    '/',
    verifyActiveAccount,
    checkPermission([PERMISSIONS.THEME.CREATE]),
    controller.create
);

/*
router.post(
    '/import',
    verifyActiveAccount,
    checkPermission([PERMISSIONS.THEME.IMPORT]),
    controller.import
);
*/

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

router.post(
    "/import/:id",
    verifyActiveAccount,
    checkPermission("theme:import"),
    upload.single('file'),
    controller.import
);

export default router;
