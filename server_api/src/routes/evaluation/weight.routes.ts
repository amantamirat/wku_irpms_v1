import { Router } from 'express';
import weightController from '../../controllers/evaluation/weight.controller';
import { verifyActiveAccount } from '../../middleware/auth';

const router: Router = Router();

router.post('/', verifyActiveAccount, weightController.createWeightWithCriterionOptions);
router.get('/', verifyActiveAccount, weightController.getAllWeights);
router.get('/stage/:stage', verifyActiveAccount, weightController.getWeightsByStage);
router.put('/:id', verifyActiveAccount, weightController.updateWeightWithCriterionOptions);
router.delete('/:id', verifyActiveAccount, weightController.deleteWeight);

export default router;
