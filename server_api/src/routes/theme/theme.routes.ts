import { Router } from 'express';
import themeController from '../../controllers/theme/theme.controller';
import { verifyActiveAccount } from '../../middleware/auth';

const router: Router = Router();

router.post('/', verifyActiveAccount, themeController.createTheme);
router.get('/', verifyActiveAccount, themeController.getAllThemes);
router.get('/directorate/:directorate', verifyActiveAccount, themeController.getThemesByDirectorate);
router.put('/:id', verifyActiveAccount, themeController.updateTheme);
router.delete('/:id', verifyActiveAccount, themeController.deleteTheme);

export default router;
