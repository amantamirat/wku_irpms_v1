import { Router } from 'express';
import { CalendarController } from './calendar.controller';
import { verifyActiveAccount, checkPermission, checkTransitionPermission } from '../users/auth/auth.middleware';
import { PERMISSIONS } from '../../common/constants/permissions';
import { CalendarRepository } from './calendar.repository';
import { CalendarService } from './calendar.service';
import { CallRepository } from '../calls/call.repository';

const repository = new CalendarRepository();
const callRepository = new CallRepository();
const service = new CalendarService(repository, callRepository);
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
