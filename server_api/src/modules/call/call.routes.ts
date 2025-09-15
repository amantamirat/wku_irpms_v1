import { Router } from 'express';
import { verifyActiveAccount } from '../users/auth/auth.middleware';
import { CallController } from './call.controller';


const router: Router = Router();

router.post('/', verifyActiveAccount, CallController.createCall);
router.get('/', verifyActiveAccount, CallController.getCalls);
router.put('/:id', verifyActiveAccount, CallController.updateCall);
router.delete('/:id', verifyActiveAccount, CallController.deleteCall);

export default router;
