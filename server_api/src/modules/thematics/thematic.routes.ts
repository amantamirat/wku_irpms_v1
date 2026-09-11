import { Router } from 'express';
import { ThematicController } from './thematic.controller';
import { PERMISSIONS } from '../../common/constants/permissions';
import { verifyAuthToken } from '../auth/auth.middleware';
import { checkTransitionPermission } from '../../core/container';
import { checkPermission } from '../../core/container';
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
    verifyAuthToken,
    checkPermission([PERMISSIONS.THEMATIC.CREATE]),
    controller.create
);

router.get(
    '/',
    verifyAuthToken,
    checkPermission([PERMISSIONS.THEMATIC.READ]),
    controller.get
);

router.put(
    '/:id',
    verifyAuthToken,
    checkPermission([PERMISSIONS.THEMATIC.UPDATE]),
    controller.update
);

router.patch('/:id', verifyAuthToken,
    checkTransitionPermission("thematic"),
    controller.transitionState);

router.delete(
    '/:id',
    verifyAuthToken,
    checkPermission([PERMISSIONS.THEMATIC.DELETE]),
    controller.delete
);

export default router;
