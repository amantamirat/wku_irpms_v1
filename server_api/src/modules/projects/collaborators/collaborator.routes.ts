import { Router } from 'express';
import { PERMISSIONS } from '../../../common/constants/permissions';
import { collabService } from '../../../core/container';
import { verifyAuthToken } from '../../auth/auth.middleware';
import { checkTransitionPermission } from '../../../core/container';
import { checkPermission } from '../../../core/container';
import { CollaboratorController } from './collaborator.controller';




const controller = new CollaboratorController(collabService);
const router: Router = Router();

router.post('/', verifyAuthToken,
    checkPermission([PERMISSIONS.COLLABORATOR.CREATE]),
    controller.create);

router.get('/', verifyAuthToken,
    checkPermission([PERMISSIONS.COLLABORATOR.READ]),
    controller.get);

router.get('/me', verifyAuthToken,
    controller.getMyCollaborations);

router.put('/:id', verifyAuthToken,
    checkPermission([PERMISSIONS.COLLABORATOR.UPDATE]),
    controller.update);

router.patch('/:id', verifyAuthToken,
    checkTransitionPermission("collaborator"),
    controller.transitionState);

router.delete('/:id', verifyAuthToken,
    checkPermission([PERMISSIONS.COLLABORATOR.DELETE]),
    controller.delete);

export default router;
