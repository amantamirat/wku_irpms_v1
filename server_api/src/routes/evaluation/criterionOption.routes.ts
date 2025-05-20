import { Router } from 'express';
import criterionOptionController from '../../controllers/evaluation/criterionOption.controller';
import { verifyActiveAccount } from '../../middleware/auth';

const router: Router = Router();

router.post('/', verifyActiveAccount, criterionOptionController.createCriterionOption);
router.get('/', verifyActiveAccount, criterionOptionController.getAllCriterionOptions);
router.get('/weight/:weight', verifyActiveAccount, criterionOptionController.getCriterionOptionsByWeight);
router.put('/:id', verifyActiveAccount, criterionOptionController.updateCriterionOption);
router.delete('/:id', verifyActiveAccount, criterionOptionController.deleteCriterionOption);

export default router;
