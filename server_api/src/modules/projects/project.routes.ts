import { Router } from 'express';
import { PERMISSIONS } from '../../common/constants/permissions';
import { checkPermission, checkTransitionPermission, verifyActiveAccount } from '../users/auth/auth.middleware';
import { ProjectController } from './project.controller';
import { ProjectService } from './project.service';

const controller = new ProjectController(new ProjectService());
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
