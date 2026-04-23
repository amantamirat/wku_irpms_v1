import { Router } from 'express';
import { checkPermission, checkTransitionPermission, verifyActiveAccount } from '../auth/auth.middleware';
import { AccountController } from './account.controller';

const controller = new AccountController();
const router: Router = Router();
router.post('/', verifyActiveAccount,
    checkPermission("account:create"),
    controller.create);
router.get('/', verifyActiveAccount,
    checkPermission("account:read"),
    controller.get);
router.put('/:id', verifyActiveAccount,
    checkPermission("account:update"),
    controller.update);
router.patch(
    '/:id', verifyActiveAccount,
    checkTransitionPermission("account"),
    controller.transitionState);
router.delete('/:id', verifyActiveAccount,
    checkPermission("account:delete"),
    controller.delete);
export default router;
