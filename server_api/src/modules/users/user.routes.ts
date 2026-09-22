import { Router } from 'express';

import {
    userService,
    checkPermission
} from '../../core/container';

import { verifyAuthToken } from '../auth/auth.middleware';

import { UserController } from './user.controller';

const controller = new UserController(userService);

const router: Router = Router();

router.post(
    '/',
    verifyAuthToken,
    checkPermission('user:create'),
    controller.create
);

router.get(
    '/lookup',
    verifyAuthToken,
    checkPermission('user:lookup'),
    controller.lookup
);

router.get(
    '/',
    verifyAuthToken,
    checkPermission('user:read'),
    controller.get
);

router.get(
    '/deleted',
    verifyAuthToken,
    checkPermission('user:deleted:read'),
    controller.getDeleted
);

router.put(
    '/:id',
    verifyAuthToken,
    checkPermission('user:update'),
    controller.update
);

router.put(
    '/:id/roles',
    verifyAuthToken,
    checkPermission('user:role:update'),
    controller.updateRoles
);

router.put(
    '/:id/scope',
    verifyAuthToken,
    checkPermission('user:scope:update'),
    controller.updateScope
);

router.patch(
    '/:id/restore',
    verifyAuthToken,
    checkPermission('user:restore'),
    controller.restore
);

router.delete(
    '/:id',
    verifyAuthToken,
    checkPermission('user:delete'),
    controller.delete
);

export default router;