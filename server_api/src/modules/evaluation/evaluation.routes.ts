import { Router } from 'express';
import evaluationController from './evaluation.controller';
import { verifyActiveAccount } from '../../middleware/auth';

const router = Router();

router.post('/', verifyActiveAccount, evaluationController.createEvaluation);
router.get('/parent/:parent', verifyActiveAccount, evaluationController.getEvaluationsByParent);
router.get('/directorate/:directorate', verifyActiveAccount, evaluationController.getEvaluationsByDirectorate);
router.put('/:id', verifyActiveAccount, evaluationController.updateEvaluation);
router.delete('/:id', verifyActiveAccount, evaluationController.deleteEvaluation);

export default router;
