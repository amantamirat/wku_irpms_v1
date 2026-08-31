import { Router } from 'express';
import { PERMISSIONS } from '../../../common/constants/permissions';
import { collabService } from '../../../core/container';
import { checkPermission, checkTransitionPermission, verifyActiveAccount } from '../../auth/auth.middleware';
import { CollaboratorController } from './collaborator.controller';



/*
const service = new CollaboratorService(
    repository, projectRepo, projAuth, appRepository, constValidator, notificationService
)*/
const controller = new CollaboratorController(collabService);
const router: Router = Router();

router.post('/', verifyActiveAccount,
    checkPermission([PERMISSIONS.COLLABORATOR.CREATE]),
    controller.create);

router.get('/', verifyActiveAccount,
    checkPermission([PERMISSIONS.COLLABORATOR.READ]),
    controller.get);

router.get('/me', verifyActiveAccount,
    controller.getMyCollaborations);

router.put('/:id', verifyActiveAccount,
    checkPermission([PERMISSIONS.COLLABORATOR.UPDATE]),
    controller.update);

router.patch('/:id', verifyActiveAccount,
    checkTransitionPermission("collaborator"),
    controller.transitionState);

router.delete('/:id', verifyActiveAccount,
    checkPermission([PERMISSIONS.COLLABORATOR.DELETE]),
    controller.delete);

export default router;
