import { Router } from 'express';
import { EvaluationController } from './evaluation.controller';
import { verifyActiveAccount } from '../../users/auth/auth.middleware';

const router = Router();


router.post('/', verifyActiveAccount, EvaluationController.createEvaluation);
router.get('/', verifyActiveAccount, EvaluationController.getEvaluations);
router.put('/reorder/:id/:direction', verifyActiveAccount, EvaluationController.reorderStageLevel);
router.put('/:id', verifyActiveAccount, EvaluationController.updateEvaluation);
router.delete('/:id', verifyActiveAccount, EvaluationController.deleteEvaluation);
// Batch import criteria with options under a stage
router.post('/import-criteria', verifyActiveAccount, EvaluationController.importCriteriaBatch);

export default router;
