import { Router } from 'express';
import { ProThemeController } from './protheme.controller';
import { verifyActiveAccount } from '../../users/auth/auth.middleware';


const router: Router = Router();

router.post('/', verifyActiveAccount, ProThemeController.createProTheme);
router.get('/', verifyActiveAccount, ProThemeController.getProThemes);
router.put('/:id', verifyActiveAccount, ProThemeController.updateProTheme);
router.delete('/:id', verifyActiveAccount, ProThemeController.deleteProTheme);

export default router;
