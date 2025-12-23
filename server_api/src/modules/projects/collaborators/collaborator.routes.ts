import { Router } from 'express';
import { CollaboratorController } from './collaborator.controller';
import { checkPermission, checkStatusPermission, verifyActiveAccount } from '../../users/user.middleware';
import { PERMISSIONS } from '../../../common/constants/permissions';

const controller = new CollaboratorController();
const router: Router = Router();

router.post('/', verifyActiveAccount,
    checkPermission([PERMISSIONS.COLLABORATOR.CREATE]),
    controller.create);
router.get('/', verifyActiveAccount,
    checkPermission([PERMISSIONS.COLLABORATOR.READ]),
    controller.get);
/*    
router.put('/', verifyActiveAccount, 
    checkPermission([PERMISSIONS.COLLABORATOR.UPDATE]),
    controller.update);
*/
router.put('/:status', verifyActiveAccount,
    checkStatusPermission("collaborator"),
    controller.updateStatus);

router.delete('/:id', verifyActiveAccount,
    checkPermission([PERMISSIONS.COLLABORATOR.DELETE]),
    controller.delete);

export default router;
