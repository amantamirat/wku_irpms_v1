import { Router } from 'express';
import { ExperienceController } from './experience.controller';
import { PERMISSIONS } from '../../../util/permissions';
import { verifyActiveAccount, checkPermission } from '../../users/user.middleware';


const router: Router = Router();

router.post(
    '/',
    verifyActiveAccount,
    checkPermission([PERMISSIONS.EXPERIENCE.CREATE]),
    ExperienceController.createExperience
);

router.get(
    '/',
    verifyActiveAccount,
    checkPermission([PERMISSIONS.EXPERIENCE.READ]),
    ExperienceController.getExperiences
);

router.put(
    '/:id',
    verifyActiveAccount,
    checkPermission([PERMISSIONS.EXPERIENCE.UPDATE]),
    ExperienceController.updateExperience
);

router.delete(
    '/:id',
    verifyActiveAccount,
    checkPermission([PERMISSIONS.EXPERIENCE.DELETE]),
    ExperienceController.deleteExperience
);

export default router;
