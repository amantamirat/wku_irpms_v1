import { Router } from 'express';
import { checkUnitPermission, verifyActiveAccount } from '../auth/auth.middleware';
import { OrganizationController } from './organization.controller';

import { enrollmentRepo, exprienceRepo, grantRepo, organizationRepo, userRepo } from '../../core/container';
import { OrganizationService } from './organization.service';


const router = Router();

const service = new OrganizationService(organizationRepo, userRepo, grantRepo,
    enrollmentRepo, exprienceRepo);
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

router.get('/:id', verifyActiveAccount,
    controller.getById);

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
