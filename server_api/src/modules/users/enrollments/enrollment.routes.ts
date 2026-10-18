import { Router } from 'express';
import { calendarRepo, checkPermission, enrollmentRepo, organizationRepo, userRepo } from '../../../core/container';
import { verifyAuthToken } from '../../auth/auth.middleware';
import { EnrollmentController } from './enrollment.controller';
import { EnrollmentService } from './enrollment.service';


const service = new EnrollmentService(
    enrollmentRepo,
    calendarRepo,
    organizationRepo,
    userRepo
);

const controller = new EnrollmentController(service);
const router: Router = Router();

router.post('/',
    verifyAuthToken,
    checkPermission("enrollment:create"),
    controller.create
);

router.get('/',
    verifyAuthToken,
    checkPermission("enrollment:read"),
    controller.get
);

router.get('/lookup',
    verifyAuthToken,
    checkPermission("enrollment:lookup"),
    controller.get
);

router.put('/:id',
    verifyAuthToken,
    checkPermission("enrollment:update"),
    controller.update
);

router.delete('/:id',
    verifyAuthToken,
    checkPermission("enrollment:delete"),
    controller.delete
);

export default router;
