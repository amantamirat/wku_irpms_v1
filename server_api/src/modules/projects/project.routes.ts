import { Router } from 'express';

import { PERMISSIONS } from '../../common/constants/permissions';

import {
    activityRepo,
    phaseRepo,
    projectRepo,
    projectService
} from '../../core/container';

import {
    verifyAuthToken,
} from '../auth/auth.middleware';

import {
    checkTransitionPermission,
    checkPermission,
} from '../../core/container';

import { ProjectController } from './project.controller';

import { upload } from '../../common/middleware/fileUpload.middleware';
import { ProjectProgressService } from './project-progress-service';

const controller = new ProjectController(
    projectService,
    new ProjectProgressService(projectRepo, phaseRepo, activityRepo)
);

const router: Router = Router();

// --------------------------------------------------
// Create
// --------------------------------------------------

router.post(
    '/',
    verifyAuthToken,
    checkPermission([
        PERMISSIONS.PROJECT.CREATE,
        PERMISSIONS.PROJECT.CREATE_OWN,
    ]),
    controller.create
);

router.post(
    '/apply',
    verifyAuthToken,
    checkPermission('project:apply'),
    upload.single('file', ['application/pdf']),
    controller.apply
);

// --------------------------------------------------
// Fetch / Query
// --------------------------------------------------

router.get(
    '/',
    verifyAuthToken,
    checkPermission([PERMISSIONS.PROJECT.READ]),
    controller.get
);

// Put /me before /:id
router.get(
    '/me',
    verifyAuthToken,
    controller.getMyProjects
);

// Lookup projects
router.get(
    '/lookup',
    verifyAuthToken,
    checkPermission([PERMISSIONS.PROJECT.LOOKUP]),
    controller.lookup
);

// --------------------------------------------------
// Project Progress
// --------------------------------------------------

router.get(
    '/:id/progress',
    verifyAuthToken,
    checkPermission([PERMISSIONS.PROJECT.READ]),
    controller.getProgress
);

// --------------------------------------------------
// Get by ID
// --------------------------------------------------

router.get(
    '/:id',
    verifyAuthToken,
    checkPermission([PERMISSIONS.PROJECT.LOOKUP]),
    controller.getById
);

// --------------------------------------------------
// Update
// --------------------------------------------------

router.put(
    '/:id',
    verifyAuthToken,
    checkPermission([
        PERMISSIONS.PROJECT.UPDATE,
        PERMISSIONS.PROJECT.UPDATE_OWN,
    ]),
    controller.update
);

// --------------------------------------------------
// Transition
// --------------------------------------------------

router.patch(
    '/:id',
    verifyAuthToken,
    checkTransitionPermission('project'),
    controller.transitionState
);

// --------------------------------------------------
// Delete
// --------------------------------------------------

router.delete(
    '/:id',
    verifyAuthToken,
    checkPermission([
        PERMISSIONS.PROJECT.DELETE,
        PERMISSIONS.PROJECT.DELETE_OWN,
    ]),
    controller.delete
);

export default router;