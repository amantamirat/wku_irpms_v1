import { Router } from 'express';
import { CompositionController } from './composition.controller';
import { verifyActiveAccount } from '../../../users/auth/auth.middleware';

const router: Router = Router();

router.post('/', verifyActiveAccount, CompositionController.createComposition);
router.get('/', verifyActiveAccount, CompositionController.getCompositions);
router.put('/:id', verifyActiveAccount, CompositionController.updateComposition);
router.delete('/:id', verifyActiveAccount, CompositionController.deleteComposition);

export default router;
