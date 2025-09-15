import { Router } from 'express';
import { EvaluationController } from './eval.controller';
import { verifyActiveAccount } from '../users/auth/auth.middleware';

const router = Router();

router.post('/', verifyActiveAccount, EvaluationController.createEvaluation);
router.get('/', verifyActiveAccount, EvaluationController.getEvaluations);
router.put('/reorder/:id/:direction', verifyActiveAccount, EvaluationController.reorderStageLevel);
router.put('/:id', verifyActiveAccount, EvaluationController.updateEvaluation);
router.delete('/:id', verifyActiveAccount, EvaluationController.deleteEvaluation);

export default router;
