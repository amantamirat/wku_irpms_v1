import { Router } from 'express';
import { PERMISSIONS } from '../../common/constants/permissions';
import { GrantAllocationRepository } from '../grants/allocations/grant.allocation.repository';
import { checkPermission, checkTransitionPermission, verifyActiveAccount } from '../auth/auth.middleware';
import { CalendarController } from './calendar.controller';
import { CalendarRepository } from './calendar.repository';
import { CalendarService } from './calendar.service';

const repository = new CalendarRepository();
const grantAllocRepository = new GrantAllocationRepository();
const service = new CalendarService(repository, grantAllocRepository);
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
