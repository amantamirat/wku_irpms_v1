import { Router } from 'express';
import subAreaController from '../../controllers/theme/subArea.controller';
import { verifyActiveAccount } from '../../middleware/auth';

const router: Router = Router();

router.post('/', verifyActiveAccount, subAreaController.createSubArea);
router.get('/', verifyActiveAccount, subAreaController.getAllSubAreas);
router.get('/priorityArea/:priorityArea', verifyActiveAccount, subAreaController.getSubAreasByPriorityArea);
router.put('/:id', verifyActiveAccount, subAreaController.updateSubArea);
router.delete('/:id', verifyActiveAccount, subAreaController.deleteSubArea);

export default router;
