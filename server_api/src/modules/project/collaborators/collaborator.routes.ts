import { Router } from 'express';
import { CollaboratorController } from './collaborator.controller';
import { verifyActiveAccount } from '../../users/auth/auth.middleware';


const router: Router = Router();

router.post('/', verifyActiveAccount, CollaboratorController.createCollaborator);
router.get('/', verifyActiveAccount, CollaboratorController.getCollaborators);
router.put('/:id', verifyActiveAccount, CollaboratorController.updateCollaborator);
router.delete('/:id', verifyActiveAccount, CollaboratorController.deleteCollaborator);

export default router;
