import { Router } from 'express';
import priorityAreaController from '../../controllers/theme/priorityArea.controller';
import { verifyActiveAccount } from '../../middleware/auth';

const router: Router = Router();

router.post('/', verifyActiveAccount, priorityAreaController.createPriorityArea);
router.get('/', verifyActiveAccount, priorityAreaController.getAllPriorityAreas);
router.get('/theme/:theme', verifyActiveAccount, priorityAreaController.getPriorityAreasByTheme);
router.put('/:id', verifyActiveAccount, priorityAreaController.updatePriorityArea);
router.delete('/:id', verifyActiveAccount, priorityAreaController.deletePriorityArea);

export default router;
