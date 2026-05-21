import { Router } from 'express';
import { PERMISSIONS } from '../../common/constants/permissions';
import { GrantAllocationRepository } from '../grants/allocations/grant.allocation.repository';
import { checkPermission, checkTransitionPermission, verifyActiveAccount } from '../auth/auth.middleware';
import { CalendarController } from './calendar.controller';
import { CalendarRepository } from './calendar.repository';
import { CalendarService } from './calendar.service';
import { EnrollmentRepository } from '../users/enrollments/enrollment.repository';

const repository = new CalendarRepository();
const grantAllocRepo = new GrantAllocationRepository();
const enrollmentRepo = new EnrollmentRepository();
const service = new CalendarService(repository, grantAllocRepo, enrollmentRepo);
const controller = new CalendarController(service);

const router: Router = Router();

router.post('/', verifyActiveAccount, checkPermission([PERMISSIONS.CALENDAR.CREATE]),
  controller.create);

router.get('/', verifyActiveAccount,
  checkPermission([PERMISSIONS.CALENDAR.READ]),
  controller.get
);

router.get('/:id', verifyActiveAccount,
  checkPermission([PERMISSIONS.CALENDAR.READ]),
  controller.getById
);

router.put('/:id', verifyActiveAccount,
  checkPermission([PERMISSIONS.CALENDAR.UPDATE]),
  controller.update
);

router.patch('/:id', verifyActiveAccount,
  checkTransitionPermission("calendar"),
  controller.transitionState);

router.delete('/:id', verifyActiveAccount,
  checkPermission([PERMISSIONS.CALENDAR.DELETE]),
  controller.delete
);

export default router;
