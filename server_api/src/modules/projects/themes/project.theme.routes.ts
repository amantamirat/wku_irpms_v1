import { Router } from 'express';
import { ProjectThemeController } from './project.theme.controller';
import { checkPermission, verifyActiveAccount } from '../../users/user.middleware';
import { PERMISSIONS } from '../../../common/constants/permissions';
import { ThemeRepository } from '../../thematics/themes/theme.repository';
import { ProjectRepository } from '../project.repository';
import { ProjectThemeRepository } from './project.theme.repository';
import { ProjectThemeService } from './project.theme.service';

const repository = new ProjectThemeRepository();
const projectRepository = new ProjectRepository();
const themeRepository = new ThemeRepository();
const service = new ProjectThemeService(repository, projectRepository, themeRepository);
const controller = new ProjectThemeController(service);
const router: Router = Router();

router.post('/', verifyActiveAccount,
    checkPermission([PERMISSIONS.PROJECT_THEME.CREATE]), controller.create);
router.get('/', verifyActiveAccount,
    checkPermission([PERMISSIONS.PROJECT_THEME.READ]), controller.get);
router.delete('/:id', verifyActiveAccount,
    checkPermission([PERMISSIONS.PROJECT_THEME.DELETE]), controller.delete);

export default router;
