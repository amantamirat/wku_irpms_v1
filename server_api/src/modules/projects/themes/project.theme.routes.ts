import { Router } from 'express';
import { ProjectThemeController } from './project.theme.controller';
import { verifyActiveAccount } from '../../users/user.middleware';


const router: Router = Router();

router.post('/', verifyActiveAccount, ProjectThemeController.createProjectTheme);
router.get('/', verifyActiveAccount, ProjectThemeController.getProjectThemes);
router.delete('/:id', verifyActiveAccount, ProjectThemeController.deleteProjectTheme);

export default router;
