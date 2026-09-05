import { Router } from 'express';
import { PERMISSIONS } from '../../../common/constants/permissions';
import { phaseService } from '../../../core/container';
import { verifyActiveAccount } from '../../auth/auth.middleware';
import { checkTransitionPermission } from '../../../core/container';
import { checkPermission } from '../../../core/container';
import { PhaseController } from './phase.controller';

const controller = new PhaseController(phaseService);
const router: Router = Router();

router.post('/', verifyActiveAccount,
    checkPermission([PERMISSIONS.PHASE.CREATE]),
    controller.create);
router.get('/', verifyActiveAccount,
    checkPermission([PERMISSIONS.PHASE.READ]),
    controller.get);
router.put('/:id', verifyActiveAccount,
    checkPermission([PERMISSIONS.PHASE.UPDATE]),
    controller.update);
router.patch(
    '/:id', verifyActiveAccount,
    checkTransitionPermission("phase"),
    controller.transitionState
);
router.delete('/:id', verifyActiveAccount,
    checkPermission([PERMISSIONS.PHASE.DELETE]),
    controller.delete);

export default router;
