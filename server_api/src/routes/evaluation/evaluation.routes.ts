import { Router } from 'express';
import evaluationController from '../../controllers/evaluation/evaluation.controller';
import { verifyActiveAccount } from '../../middleware/auth';

const router: Router = Router();

router.post('/', verifyActiveAccount, evaluationController.createEvaluation);
router.get('/', verifyActiveAccount, evaluationController.getAllEvaluations);
router.get('/directorate/:directorate', verifyActiveAccount, evaluationController.getEvaluationsByDirectorate);
router.put('/:id', verifyActiveAccount, evaluationController.updateEvaluation);
router.delete('/:id', verifyActiveAccount, evaluationController.deleteEvaluation);

export default router;
