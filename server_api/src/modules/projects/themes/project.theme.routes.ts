import { Router } from 'express';
import { ProjectThemeController } from './project.theme.controller';
import { verifyActiveAccount } from '../../users/user.middleware';

const controller = new ProjectThemeController();
const router: Router = Router();

router.post('/', verifyActiveAccount, controller.create);
router.get('/', verifyActiveAccount, controller.get);
router.delete('/:id', verifyActiveAccount, controller.delete);

export default router;
