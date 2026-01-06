import { Router } from 'express';
import { ExperienceController } from './experience.controller';
import { ExperienceService } from './experience.service';
import { PERMISSIONS } from '../../../common/constants/permissions';
import { verifyActiveAccount, checkPermission } from '../../users/user.middleware';
import { ExperienceRepository } from './experience.repository';
import { ApplicantRepository } from '../applicant.repository';
import { OrganizationRepository } from '../../organization/organization.repository';

const router: Router = Router();

// Instantiate service & controller
const experinceRepository = new ExperienceRepository();
const applicantRepository = new ApplicantRepository();
const organRepository = new OrganizationRepository();

const experienceService = new ExperienceService(
    experinceRepository, applicantRepository, organRepository
);

const experienceController = new ExperienceController(experienceService);

router.post(
    '/',
    verifyActiveAccount,
    checkPermission([PERMISSIONS.EXPERIENCE.CREATE]),
    experienceController.create
);

router.get(
    '/',
    verifyActiveAccount,
    checkPermission([PERMISSIONS.EXPERIENCE.READ]),
    experienceController.get
);

router.put(
    '/:id',
    verifyActiveAccount,
    checkPermission([PERMISSIONS.EXPERIENCE.UPDATE]),
    experienceController.update
);

router.delete(
    '/:id',
    verifyActiveAccount,
    checkPermission([PERMISSIONS.EXPERIENCE.DELETE]),
    experienceController.delete
);

export default router;
