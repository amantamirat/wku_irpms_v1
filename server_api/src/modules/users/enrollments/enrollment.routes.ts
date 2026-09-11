import { Router } from 'express';
import { EnrollmentController } from './enrollment.controller';
import { PERMISSIONS } from '../../../common/constants/permissions';
import { EnrollmentService } from './enrollment.service';
import { EnrollmentRepository } from './enrollment.repository';
import { CalendarRepository } from '../../calendar/calendar.repository';
import { verifyAuthToken } from '../../auth/auth.middleware';
import { checkPermission } from '../../../core/container';
import { UserRepository } from '../user.repository';
import { OrganizationRepository } from '../../organization/organization.repository';


const enrollmentRepository = new EnrollmentRepository();
const calendarRepository = new CalendarRepository();
const programRepository = new OrganizationRepository();
const userRepository = new UserRepository();

const service = new EnrollmentService(
    enrollmentRepository,
    calendarRepository,
    programRepository,
    userRepository
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
