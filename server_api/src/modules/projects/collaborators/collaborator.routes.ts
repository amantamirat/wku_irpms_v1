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
    checkPermission([PERMISSIONS.COLLABORATOR.CREATE, PERMISSIONS.COLLABORATOR.CREATE_OWN]),
    controller.create);

router.get('/', verifyAuthToken,
    checkPermission([PERMISSIONS.COLLABORATOR.READ]),
    controller.get);

// Lookup - currently uses the same get controller
router.get(
    '/lookup',
    verifyAuthToken,
    checkPermission("collaborator:lookup"),
    controller.lookup
);

router.get('/me', verifyAuthToken,
    controller.getMyCollaborations);

router.put('/:id', verifyAuthToken,
    checkPermission([PERMISSIONS.COLLABORATOR.UPDATE]),
    controller.update);

router.patch('/:id', verifyAuthToken,
    checkTransitionPermission("collaborator"),
    controller.transitionState);

router.delete('/:id', verifyAuthToken,
    checkPermission([PERMISSIONS.COLLABORATOR.DELETE, PERMISSIONS.COLLABORATOR.DELETE_OWN]),
    controller.delete);

export default router;
