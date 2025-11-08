import { Router } from 'express';
import { PhaseController } from './phase.controller';
import { verifyActiveAccount } from '../../users/auth/auth.middleware';


const router: Router = Router();

router.post('/', verifyActiveAccount, PhaseController.createPhase);
router.get('/', verifyActiveAccount, PhaseController.getPhases);
router.put('/:id', verifyActiveAccount, PhaseController.updatePhase);
router.delete('/:id', verifyActiveAccount, PhaseController.deletePhase);

export default router;
