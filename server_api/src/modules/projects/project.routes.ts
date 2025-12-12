import { Router } from 'express';
import { ProjectController } from './project.controller';
import { checkPermission, verifyActiveAccount } from '../users/user.middleware';
import { PERMISSIONS } from '../../common/constants/permissions';

const router: Router = Router();

router.post('/', verifyActiveAccount,
    checkPermission([PERMISSIONS.PROJECT.CREATE]),
    ProjectController.createProject);
//router.post("/submit", verifyActiveAccount, upload.single("document"), ProjectController.submitProject);
router.get('/', verifyActiveAccount,
    checkPermission([PERMISSIONS.PROJECT.READ]),
    ProjectController.getProjects);
router.put('/:id', verifyActiveAccount,
    checkPermission([PERMISSIONS.PROJECT.UPDATE]),
    ProjectController.updateProject);
router.delete('/:id', verifyActiveAccount,
    checkPermission([PERMISSIONS.PROJECT.DELETE]),
    ProjectController.deleteProject);

export default router;
