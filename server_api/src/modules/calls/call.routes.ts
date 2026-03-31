import { Router } from 'express';
import { PERMISSIONS } from '../../common/constants/permissions';
import { checkPermission, checkStatusPermission, checkTransitionPermission, verifyActiveAccount } from '../users/auth/auth.middleware';
import { CallController } from './call.controller';
import { CallRepository } from './call.repository';
import { CallService } from './call.service';
import { CalendarRepository } from '../calendar/calendar.repository';
import { OrganizationRepository } from '../organization/organization.repository';
import { GrantRepository } from '../grants/grant.repository';
import { CallStageRepository } from './stages/call.stage.repository';
import { ThematicRepository } from '../thematics/thematic.repository';
import { GrantStageRepository } from '../grants/stages/grant.stage.repository';

const repository = new CallRepository();
const calendarRepo = new CalendarRepository();
const callStageRepo = new CallStageRepository();
const grantStageRepo = new GrantStageRepository();
const service = new CallService(repository, calendarRepo, callStageRepo, grantStageRepo);
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
router.patch(
    '/:id',
    verifyActiveAccount,
    checkTransitionPermission("call"),
    controller.transitionState
);

// Delete cycle
router.delete(
    '/:id',
    verifyActiveAccount,
    checkPermission([PERMISSIONS.CALL.DELETE]),
    controller.delete
);

export default router;