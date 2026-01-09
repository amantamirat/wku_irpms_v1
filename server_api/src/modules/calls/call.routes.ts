import { Router } from 'express';
import { PERMISSIONS } from '../../common/constants/permissions';
import { checkPermission, checkStatusPermission, verifyActiveAccount } from '../users/user.middleware';
import { CallController } from './call.controller';
import { CallRepository } from './call.repository';
import { CallService } from './call.service';
import { CalendarRepository } from '../calendar/calendar.repository';


const repository = new CallRepository();
const calendarRepository = new CalendarRepository();
const service = new CallService(repository, calendarRepository);
const controller = new CallController(service);
const router = Router();

router.post(
    '/',
    verifyActiveAccount,
    checkPermission([PERMISSIONS.CALL.CREATE]),
    controller.create
);
// Get cycles
router.get(
    '/',
    verifyActiveAccount,
    checkPermission([PERMISSIONS.CALL.READ]),
    controller.get
);
// Update call
router.put(
    '/',
    verifyActiveAccount,
    checkPermission([PERMISSIONS.CALL.UPDATE]),
    controller.update
);
// Update status
router.put(
    '/:status',
    verifyActiveAccount,
    checkStatusPermission("call"),
    controller.updateStatus
);

// Delete cycle
router.delete(
    '/:id',
    verifyActiveAccount,
    checkPermission([PERMISSIONS.CALL.DELETE]),
    controller.delete
);

export default router;