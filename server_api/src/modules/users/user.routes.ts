import { Router } from 'express';
import { PERMISSIONS } from '../../common/constants/permissions';
import { verifyActiveAccount, checkPermission } from '../auth/auth.middleware';
import { UserController } from './user.controller';
import { UserService } from './user.service';
const service = new UserService();
const controller = new UserController(service);
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
