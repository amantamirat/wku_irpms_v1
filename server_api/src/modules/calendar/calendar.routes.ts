import { Router } from 'express';
import { CalendarController } from './calendar.controller';
import { verifyActiveAccount, checkPermission } from '../users/user.middleware';
import { PERMISSIONS } from '../../util/permissions';

const router: Router = Router();

router.post(
  '/',
  verifyActiveAccount,
  checkPermission([PERMISSIONS.CALENDAR.CREATE]),
  CalendarController.createCalendar
);

router.get(
  '/',
  verifyActiveAccount,
  checkPermission([
    PERMISSIONS.CALENDAR.READ
  ]),
  CalendarController.getCalendars
);

router.put(
  '/:id',
  verifyActiveAccount,
  checkPermission([PERMISSIONS.CALENDAR.UPDATE]),
  CalendarController.updateCalendar
);

router.delete(
  '/:id',
  verifyActiveAccount,
  checkPermission([PERMISSIONS.CALENDAR.DELETE]),
  CalendarController.deleteCalendar
);

export default router;
