import { Router } from 'express';
import { checkPermission, verifyActiveAccount } from '../../users/auth/auth.middleware';
import { StageController } from './stage.controller';

const controller = new StageController();
const router = Router();

router.post(
    '/',
    verifyActiveAccount,
    checkPermission(["grant.stage:create"]),
    controller.create
);

router.get('/:id', verifyActiveAccount,
    checkPermission(["grant.stage:read"]),
    controller.getById
);

// Get 
router.get(
    '/',
    verifyActiveAccount,
    checkPermission(["grant.stage:read"]),
    controller.get
);

// Update 
router.put(
    '/:id',
    verifyActiveAccount,
    checkPermission(["grant.stage:update"]),
    controller.update
);

// Delete
router.delete(
    '/:id',
    verifyActiveAccount,
    checkPermission(["grant.stage:delete"]),
    controller.delete
);

export default router;