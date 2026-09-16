import { Router } from 'express';
import { PERMISSIONS } from '../../../common/constants/permissions';
import { phaseService } from '../../../core/container';
import { verifyAuthToken } from '../../auth/auth.middleware';
import { checkTransitionPermission } from '../../../core/container';
import { checkPermission } from '../../../core/container';
import { PhaseController } from './phase.controller';

const controller = new PhaseController(phaseService);
const router: Router = Router();

router.post('/', verifyAuthToken,
    checkPermission([PERMISSIONS.PHASE.CREATE, PERMISSIONS.PHASE.CREATE_OWN]),
    controller.create);
router.get('/', verifyAuthToken,
    checkPermission([PERMISSIONS.PHASE.READ]),
    controller.get);

// Lookup - currently uses the same get controller
router.get(
    '/lookup',
    verifyAuthToken,
    checkPermission(PERMISSIONS.PHASE.LOOKUP),
    controller.get
);
router.put('/:id', verifyAuthToken,
    checkPermission([PERMISSIONS.PHASE.UPDATE, PERMISSIONS.PHASE.UPDATE_OWN]),
    controller.update);
router.patch(
    '/:id', verifyAuthToken,
    checkTransitionPermission("phase"),
    controller.transitionState
);
router.delete('/:id', verifyAuthToken,
    checkPermission([PERMISSIONS.PHASE.DELETE, PERMISSIONS.PHASE.DELETE_OWN]),
    controller.delete);

export default router;
