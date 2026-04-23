import { Router } from 'express';
import { ExperienceController } from './experience.controller';
import { ExperienceService } from './experience.service';
import { PERMISSIONS } from '../../../common/constants/permissions';
import { verifyActiveAccount, checkPermission } from '../../auth/auth.middleware';
import { ExperienceRepository } from './experience.repository';
import { ApplicantRepository } from '../applicant.repository';
import { OrganizationRepository } from '../../organization/organization.repository';
import { PositionRepository } from '../positions/position.repository';

const router: Router = Router();

// Instantiate service & controller
const experinceRepository = new ExperienceRepository();
const applicantRepository = new ApplicantRepository();
const organRepository = new OrganizationRepository();
const posRepository = new PositionRepository();

const experienceService = new ExperienceService(
    experinceRepository, applicantRepository, organRepository, posRepository
);

const controller = new ExperienceController(experienceService);

router.post(
    '/',
    verifyActiveAccount,
    checkPermission([PERMISSIONS.EXPERIENCE.CREATE]),
    controller.create
);

router.get(
    '/',
    verifyActiveAccount,
    checkPermission([PERMISSIONS.EXPERIENCE.READ]),
    controller.get
);

router.put(
    '/:id',
    verifyActiveAccount,
    checkPermission([PERMISSIONS.EXPERIENCE.UPDATE]),
    controller.update
);

router.delete(
    '/:id',
    verifyActiveAccount,
    checkPermission([PERMISSIONS.EXPERIENCE.DELETE]),
    controller.delete
);

export default router;
