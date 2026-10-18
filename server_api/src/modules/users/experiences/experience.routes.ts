import { Router } from 'express';
import { PERMISSIONS } from '../../../common/constants/permissions';
import { checkPermission, exprienceRepo, organizationRepo, positionRepo, userRepo } from '../../../core/container';
import { verifyAuthToken } from '../../auth/auth.middleware';
import { ExperienceController } from './experience.controller';
import { ExperienceService } from './experience.service';

const router: Router = Router();



const experienceService = new ExperienceService(
    exprienceRepo, userRepo, organizationRepo, positionRepo
);

const controller = new ExperienceController(experienceService);

router.post(
    '/',
    verifyAuthToken,
    checkPermission([PERMISSIONS.EXPERIENCE.CREATE]),
    controller.create
);

router.get(
    '/',
    verifyAuthToken,
    checkPermission([PERMISSIONS.EXPERIENCE.READ]),
    controller.get
);

router.put(
    '/:id',
    verifyAuthToken,
    checkPermission([PERMISSIONS.EXPERIENCE.UPDATE]),
    controller.update
);

router.delete(
    '/:id',
    verifyAuthToken,
    checkPermission([PERMISSIONS.EXPERIENCE.DELETE]),
    controller.delete
);

export default router;
