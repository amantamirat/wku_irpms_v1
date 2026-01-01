import { Router } from 'express';
import { ProjectThemeController } from './project.theme.controller';
import { checkPermission, verifyActiveAccount } from '../../users/user.middleware';
import { PERMISSIONS } from '../../../common/constants/permissions';

const controller = new ProjectThemeController();
const router: Router = Router();

router.post('/', verifyActiveAccount,
    checkPermission([PERMISSIONS.PROJECT_THEME.CREATE]), controller.create);
router.get('/', verifyActiveAccount,
    checkPermission([PERMISSIONS.PROJECT_THEME.READ]), controller.get);
router.delete('/:id', verifyActiveAccount,
    checkPermission([PERMISSIONS.PROJECT_THEME.DELETE]), controller.delete);

export default router;
