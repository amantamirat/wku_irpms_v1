import { Router } from 'express';
import { verifyActiveAccount } from '../users/auth/auth.middleware';
import { GrantController } from './grant.controller';


const router: Router = Router();

router.post('/', verifyActiveAccount, GrantController.createGrant);
router.get('/', verifyActiveAccount, GrantController.getGrants);
router.put('/:id', verifyActiveAccount, GrantController.updateGrant);
router.delete('/:id', verifyActiveAccount, GrantController.deleteGrant);

export default router;
