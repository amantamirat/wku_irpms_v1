import { Router } from 'express';
import { PERMISSIONS } from '../../common/constants/permissions';
import { calendarRepo, callRepo, enrollmentRepo, projectRepo } from '../../core/container';
import { verifyActiveAccount } from '../auth/auth.middleware';
import { checkTransitionPermission } from '../../core/container';
import { checkPermission } from '../../core/container';
import { CalendarController } from './calendar.controller';
import { CalendarService } from './calendar.service';

const service = new CalendarService(calendarRepo, callRepo, enrollmentRepo, projectRepo);
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
