import { Router } from 'express';
import { PERMISSIONS } from '../../common/constants/permissions';
import { checkPermission, checkStatusPermission, verifyActiveAccount } from '../users/auth/auth.middleware';
import { CallController } from './call.controller';
import { CallRepository } from './call.repository';
import { CallService } from './call.service';
import { CalendarRepository } from '../calendar/calendar.repository';
import { OrganizationRepository } from '../organization/organization.repository';
import { GrantRepository } from '../grants/grant.repository';
import { StageRepository } from './stages/stage.repository';
import { ThematicRepository } from '../thematics/thematic.repository';

const repository = new CallRepository();
const calendarRepository = new CalendarRepository();
const stageRepository = new StageRepository();
const organizationRepository = new OrganizationRepository();
const grantRepository = new GrantRepository();
const thematicRepository = new ThematicRepository();

const service =
    new CallService(repository, calendarRepository, stageRepository,
        organizationRepository, grantRepository, thematicRepository);
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