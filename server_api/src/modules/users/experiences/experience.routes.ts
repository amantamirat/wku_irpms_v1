import { Router } from 'express';
import { ExperienceController } from './experience.controller';
import { ExperienceService } from './experience.service';
import { PERMISSIONS } from '../../../common/constants/permissions';
import { verifyAuthToken } from '../../auth/auth.middleware';
import { checkPermission } from '../../../core/container';
import { ExperienceRepository } from './experience.repository';
import { UserRepository } from '../user.repository';
import { OrganizationRepository } from '../../organization/organization.repository';
import { PositionRepository } from '../../positions/position.repository';

const router: Router = Router();

// Instantiate service & controller
const experinceRepository = new ExperienceRepository();
const applicantRepository = new UserRepository();
const organRepository = new OrganizationRepository();
const posRepository = new PositionRepository();

const experienceService = new ExperienceService(
    experinceRepository, applicantRepository, organRepository, posRepository
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
