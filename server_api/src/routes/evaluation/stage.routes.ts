import { Router } from 'express';
import stageController from '../../controllers/evaluation/stage.controller';
import { verifyActiveAccount } from '../../middleware/auth';

const router: Router = Router();

router.post('/', verifyActiveAccount, stageController.createStage);
router.get('/', verifyActiveAccount, stageController.getAllStages);
router.get('/evaluation/:evaluation', verifyActiveAccount, stageController.getStagesByEvaluation);
router.put('/:id', verifyActiveAccount, stageController.updateStage);
router.delete('/:id', verifyActiveAccount, stageController.deleteStage);

export default router;
