import { Router } from 'express';
import themeController from './theme.controller';
import { verifyActiveAccount } from '../../middleware/auth';

const router = Router();

router.post('/', verifyActiveAccount, themeController.createTheme);
router.get('/parent/:parent', verifyActiveAccount, themeController.getThemesByParent);
router.get('/directorate/:directorate', verifyActiveAccount, themeController.getThemesByDirectorate);
router.put('/:id', verifyActiveAccount, themeController.updateTheme);
router.delete('/:id', verifyActiveAccount, themeController.deleteTheme);

export default router;
