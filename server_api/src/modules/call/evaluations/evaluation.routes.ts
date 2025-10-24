import { Router } from 'express';
import { EvaluationController } from './evaluation.controller';
import { checkPermission, verifyActiveAccount } from '../../users/auth/auth.middleware';
import { PERMISSIONS } from '../../../util/permissions';

const router = Router();


router.post('/', verifyActiveAccount,
    checkPermission([PERMISSIONS.EVALUATION.CREATE]),
    EvaluationController.createEvaluation);
router.get('/', verifyActiveAccount,
    checkPermission([
        PERMISSIONS.EVALUATION.READ,
        PERMISSIONS.EVALUATION.CREATE,
        PERMISSIONS.EVALUATION.UPDATE,
        PERMISSIONS.EVALUATION.DELETE
    ]),
    EvaluationController.getEvaluations);
router.put('/reorder/:id/:direction', verifyActiveAccount,
    checkPermission([PERMISSIONS.EVALUATION.UPDATE]),
    EvaluationController.reorderStageLevel);
router.put('/:id', verifyActiveAccount,
    checkPermission([PERMISSIONS.EVALUATION.UPDATE]),
    EvaluationController.updateEvaluation);
router.delete('/:id', verifyActiveAccount,
    checkPermission([PERMISSIONS.EVALUATION.DELETE]),
    EvaluationController.deleteEvaluation);
// Batch import criteria with options under a stage
router.post('/import-criteria', verifyActiveAccount,
    checkPermission([PERMISSIONS.EVALUATION.CREATE]),
    EvaluationController.importCriteriaBatch);

export default router;
