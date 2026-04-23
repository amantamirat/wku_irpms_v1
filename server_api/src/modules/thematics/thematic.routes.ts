import { Router } from 'express';
import { ThematicController } from './thematic.controller';
import { PERMISSIONS } from '../../common/constants/permissions';
import { verifyActiveAccount, checkPermission, checkTransitionPermission } from '../auth/auth.middleware';
import { ThematicService } from './thematic.service';
import { ThematicRepository } from './thematic.repository';
import { ThemeRepository } from './themes/theme.repository';
import { GrantRepository } from '../grants/grant.repository';

const service = new ThematicService(
    new ThematicRepository(),
    new ThemeRepository(),
    new GrantRepository());
const controller = new ThematicController(service);

const router: Router = Router();

router.post(
    '/',
    verifyActiveAccount,
    checkPermission([PERMISSIONS.THEMATIC.CREATE]),
    controller.create
);

router.get(
    '/',
    verifyActiveAccount,
    checkPermission([PERMISSIONS.THEMATIC.READ]),
    controller.get
);

router.put(
    '/:id',
    verifyActiveAccount,
    checkPermission([PERMISSIONS.THEMATIC.UPDATE]),
    controller.update
);

router.patch('/:id', verifyActiveAccount,
    checkTransitionPermission("thematic"),
    controller.transitionState);

router.delete(
    '/:id',
    verifyActiveAccount,
    checkPermission([PERMISSIONS.THEMATIC.DELETE]),
    controller.delete
);

export default router;
