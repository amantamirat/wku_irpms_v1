import { Router } from 'express';
import callController from './call.controller';
import { verifyActiveAccount } from '../../middleware/auth';


const router: Router = Router();

router.post('/', verifyActiveAccount, callController.createCall);
router.get('/', verifyActiveAccount, callController.getAllCalls);
router.put('/:id', verifyActiveAccount, callController.updateCall);
router.delete('/:id', verifyActiveAccount, callController.deleteCall);

export default router;
