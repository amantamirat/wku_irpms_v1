import { Router } from 'express';
import { ProjectController } from './project.controller';
import { checkPermission, checkStatusPermission, checkTransitionPermission, verifyActiveAccount } from '../users/auth/auth.middleware';
import { PERMISSIONS } from '../../common/constants/permissions';

const controller = new ProjectController();
const router: Router = Router();

//create
router.post('/', verifyActiveAccount,
    checkPermission([PERMISSIONS.PROJECT.CREATE]),
    controller.create);

router.get('/', verifyActiveAccount,
    checkPermission([PERMISSIONS.PROJECT.READ]),
    controller.get);

//update    
router.put('/:id', verifyActiveAccount,
    checkPermission([PERMISSIONS.PROJECT.UPDATE]),
    controller.update);

//update status
router.patch('/:id', verifyActiveAccount,
    checkTransitionPermission("project"),
    controller.transitionState);

//delete
router.delete('/:id', verifyActiveAccount,
    checkPermission([PERMISSIONS.PROJECT.DELETE]),
    controller.delete);

export default router;
