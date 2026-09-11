import { Router } from 'express';
import { checkUnitPermission, verifyAuthToken } from '../auth/auth.middleware';
import { OrganizationController } from './organization.controller';

import { checkPermission, enrollmentRepo, exprienceRepo, grantRepo, organizationRepo, userRepo } from '../../core/container';
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
    verifyAuthToken,
    checkUnitPermission('create'),
    controller.create
);

router.get(
    '/lookup',
    verifyAuthToken,
    checkPermission('organization:lookup'),
    controller.lookup
);

router.get(
    '/',
    verifyAuthToken,
    checkUnitPermission('read'),
    controller.getAll
);

router.get('/:id', verifyAuthToken, checkPermission('organization:lookup'),
    controller.getById);

router.put(
    '/:id',
    verifyAuthToken,
    checkUnitPermission('update'),
    controller.update
);

router.delete(
    '/:id',
    verifyAuthToken,
    checkUnitPermission('delete'),

    controller.delete
);

export default router;
