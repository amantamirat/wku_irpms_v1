import { Router } from 'express';
import { CollaboratorController } from './collaborator.controller';
import { checkPermission, verifyActiveAccount } from '../../users/user.middleware';
import { PERMISSIONS } from '../../../util/permissions';


const router: Router = Router();

router.post('/', verifyActiveAccount,
    checkPermission([PERMISSIONS.COLLABORATOR.CREATE]),
    CollaboratorController.createCollaborator);
router.get('/', verifyActiveAccount, 
    checkPermission([PERMISSIONS.COLLABORATOR.READ]),
    CollaboratorController.getCollaborators);
router.put('/:id', verifyActiveAccount, 
    checkPermission([PERMISSIONS.COLLABORATOR.UPDATE]),
    CollaboratorController.updateCollaborator);
router.put('/:id/status', verifyActiveAccount,
   checkPermission([PERMISSIONS.COLLABORATOR.CHANGE_STATUS]),
    CollaboratorController.changeCollaboratorStatus);
router.delete('/:id', verifyActiveAccount, 
    checkPermission([PERMISSIONS.COLLABORATOR.DELETE]),
    CollaboratorController.deleteCollaborator);

export default router;
