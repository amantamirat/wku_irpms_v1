import { Router } from 'express';
import { checkUnitPermission, verifyActiveAccount } from '../users/auth/auth.middleware';
import { OrganizationController } from './organization.controller';

import { OrganizationRepository } from './organization.repository';
import { OrganizationService } from './organization.service';


const router = Router();
/**
 * Dependencies
 */
const repository = new OrganizationRepository();
const service = new OrganizationService(repository);
const controller = new OrganizationController(service);

/**
 * Routes
 */
router.post(
    '/',
    verifyActiveAccount,
    checkUnitPermission('create'),
    controller.create
);

router.get(
    '/',
    verifyActiveAccount,
    controller.getAll
);

router.put(
    '/:id',
    verifyActiveAccount,
    checkUnitPermission('update'),
    controller.update
);

router.delete(
    '/:id',
    verifyActiveAccount,
    checkUnitPermission('delete'),
    
    controller.delete
);

export default router;
