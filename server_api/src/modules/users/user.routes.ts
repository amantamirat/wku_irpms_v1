import { Router } from 'express';
import { userService } from '../../core/container';
import { verifyActiveAccount } from '../auth/auth.middleware';
import { checkPermission } from '../../core/container';
import { UserController } from './user.controller';

const controller = new UserController(userService);
const router: Router = Router();

router.post('/',
    verifyActiveAccount,
    checkPermission("user:create"),
    controller.create
);

router.get('/',
    verifyActiveAccount,
    checkPermission("user:read"),
    controller.get
);

router.put('/:id',
    verifyActiveAccount,
    checkPermission("user:update"),
    controller.update
);

router.put(
    '/:id/roles',
    verifyActiveAccount,
    checkPermission("user:role:update"),
    controller.updateRoles
);

router.put(
    '/:id/ownerships',
    verifyActiveAccount,
    checkPermission("user:ownership:update"),
    controller.updateOwnerships
);

router.delete('/:id',
    verifyActiveAccount,
    checkPermission("user:delete"),
    controller.delete
);

export default router;
