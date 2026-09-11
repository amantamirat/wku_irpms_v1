import { Router } from 'express';
import { verifyAuthToken } from '../auth/auth.middleware';
import { checkTransitionPermission } from '../../core/container';
import { checkPermission } from '../../core/container';
import { AccountController } from './account.controller';
import { accountService } from '../../core/container';

const controller = new AccountController(accountService);
const router: Router = Router();
router.post('/', verifyAuthToken,
    checkPermission("account:create"),
    controller.create);
router.get('/', verifyAuthToken,
    checkPermission("account:read"),
    controller.get);
router.put('/:id', verifyAuthToken,
    checkPermission("account:update"),
    controller.update);
router.patch(
    '/:id', verifyAuthToken,
    checkTransitionPermission("account"),
    controller.transitionState);
router.delete('/:id', verifyAuthToken,
    checkPermission("account:delete"),
    controller.delete);
export default router;
