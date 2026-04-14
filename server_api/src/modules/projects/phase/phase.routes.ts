import { Router } from 'express';
import { PERMISSIONS } from '../../../common/constants/permissions';
import { checkPermission, checkTransitionPermission, verifyActiveAccount } from '../../users/auth/auth.middleware';
import { PhaseController } from './phase.controller';
import { PhaseService } from './phase.service';
import { PhaseRepository } from './phase.repository';
import { ProjectRepository } from '../project.repository';
const repo= new PhaseRepository();
const projectRepo= new ProjectRepository();
const controller = new PhaseController(new PhaseService(repo, projectRepo));
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
