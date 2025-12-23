import { Router } from 'express';
import { ProjectController } from './project.controller';
import { checkPermission, verifyActiveAccount } from '../users/user.middleware';
import { PERMISSIONS } from '../../common/constants/permissions';

const controller = new ProjectController();
const router: Router = Router();

router.post('/', verifyActiveAccount,
    checkPermission([PERMISSIONS.PROJECT.CREATE]),
    controller.create);
//router.post("/submit", verifyActiveAccount, upload.single("document"), ProjectController.submitProject);
router.get('/', verifyActiveAccount,
    checkPermission([PERMISSIONS.PROJECT.READ]),
    controller.get);
router.put('/:id', verifyActiveAccount,
    checkPermission([PERMISSIONS.PROJECT.UPDATE]),
    controller.update);

router.delete('/:id', verifyActiveAccount,
    checkPermission([PERMISSIONS.PROJECT.DELETE]),
    controller.delete);

export default router;
