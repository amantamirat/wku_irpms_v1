import { Router } from 'express';
import { UserController } from './user.controller';
import { checkPermission, verifyActiveAccount } from './user.middleware';
import { PERMISSIONS } from '../../common/constants/permissions';

const router: Router = Router();

router.post("/login", UserController.login);
router.post('/', verifyActiveAccount,
    checkPermission([PERMISSIONS.USER.CREATE]),
    UserController.create);
router.get('/', verifyActiveAccount,
    checkPermission([PERMISSIONS.USER.READ])
    , UserController.getUsers);
router.put('/:id', verifyActiveAccount,
    checkPermission([PERMISSIONS.USER.UPDATE]),
    UserController.update);
router.put('/:id/status', verifyActiveAccount,
    UserController.changeStatus);
router.delete('/:id', verifyActiveAccount,
    checkPermission([PERMISSIONS.USER.DELETE]),
    UserController.deleteUser);

router.patch("/:id/change-password", verifyActiveAccount,
    UserController.changePassword);

router.post("/send-verification-code",
    UserController.sendVerificationCode);
router.post("/reset-password",
    UserController.resetUser);
router.post("/activate-user",
    UserController.activateUser);

export default router;
