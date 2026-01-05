import { Router } from 'express';
import { StudentController } from './student.controller';
import { PERMISSIONS } from '../../../common/constants/permissions';
import { StudentService } from './student.service';
import { StudentRepository } from './student.repository';
import { CalendarRepository } from '../../calendar/calendar.repository';
import { verifyActiveAccount, checkPermission } from '../../users/user.middleware';
import { ApplicantRepository } from '../applicant.repository';
import { OrganizationRepository } from '../../organization/organization.repository';


const studentRepository = new StudentRepository();
const calendarRepository = new CalendarRepository();
const programRepository = new OrganizationRepository();
const applicantRepository = new ApplicantRepository();

const service = new StudentService(
    studentRepository,
    calendarRepository,
    programRepository,
    applicantRepository
);

const controller = new StudentController(service);
const router: Router = Router();

router.post('/',
    verifyActiveAccount,
    checkPermission([PERMISSIONS.STUDENT.CREATE]),
    controller.create
);

router.get('/',
    verifyActiveAccount,
    checkPermission([PERMISSIONS.STUDENT.READ]),
    controller.get
);

router.put('/:id',
    verifyActiveAccount,
    checkPermission([PERMISSIONS.STUDENT.UPDATE]),
    controller.update
);

router.delete('/:id',
    verifyActiveAccount,
    checkPermission([PERMISSIONS.STUDENT.DELETE]),
    controller.delete
);

export default router;
