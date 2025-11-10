import { Router } from 'express';
import { ResultController } from './result.controller';
import { verifyActiveAccount } from '../../../../users/auth/auth.middleware';

const router: Router = Router();

router.post('/', verifyActiveAccount, ResultController.createResult);
router.get('/', verifyActiveAccount, ResultController.getResults);
router.put('/:id', verifyActiveAccount, ResultController.updateResult);
router.delete('/:id', verifyActiveAccount, ResultController.deleteResult);

export default router;
