import { Router } from 'express';
import { PERMISSIONS } from '../../common/constants/permissions';
import { calendarRepo, callRepo, enrollmentRepo, projectRepo } from '../../core/container';
import { verifyAuthToken } from '../auth/auth.middleware';
import { checkTransitionPermission } from '../../core/container';
import { checkPermission } from '../../core/container';
import { CalendarController } from './calendar.controller';
import { CalendarService } from './calendar.service';

const service = new CalendarService(calendarRepo, callRepo, enrollmentRepo, projectRepo);
const controller = new CalendarController(service);

const router: Router = Router();

router.post('/', verifyAuthToken, checkPermission([PERMISSIONS.CALENDAR.CREATE]),
  controller.create);

// Lookup - currently uses the same get controller
router.get('/lookup', verifyAuthToken,
  checkPermission("calendar:lookup"),
  controller.get
);
router.get('/', verifyAuthToken,
  checkPermission([PERMISSIONS.CALENDAR.READ]),
  controller.get
);

router.get('/:id', verifyAuthToken,
  checkPermission([PERMISSIONS.CALENDAR.READ]),
  controller.getById
);

router.put('/:id', verifyAuthToken,
  checkPermission([PERMISSIONS.CALENDAR.UPDATE]),
  controller.update
);

router.patch('/:id', verifyAuthToken,
  checkTransitionPermission("calendar"),
  controller.transitionState);

router.delete('/:id', verifyAuthToken,
  checkPermission([PERMISSIONS.CALENDAR.DELETE]),
  controller.delete
);

export default router;
