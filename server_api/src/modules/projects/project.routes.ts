import { Router } from 'express';
import { PERMISSIONS } from '../../common/constants/permissions';
import { projectService } from '../../core/container';
import { checkPermission, checkTransitionPermission, verifyActiveAccount } from '../auth/auth.middleware';
import { ProjectController } from './project.controller';



const controller = new ProjectController(projectService);
const router: Router = Router();

//create


router.post('/', verifyActiveAccount,
    checkPermission([PERMISSIONS.PROJECT.CREATE]),
    controller.create);


router.get('/', verifyActiveAccount,
    checkPermission([PERMISSIONS.PROJECT.READ]),
    controller.get);


//Put the /me route before /:id:

router.get(
    '/me',
    verifyActiveAccount,
    controller.getMyProjects
);

router.get('/:id', verifyActiveAccount,
    checkPermission([PERMISSIONS.PROJECT.READ]),
    controller.getById);



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
