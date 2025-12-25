import { Router } from 'express';
import { UserController } from './user.controller';
import { checkPermission, checkStatusPermission, verifyActiveAccount } from './user.middleware';
import { PERMISSIONS } from '../../common/constants/permissions';

const controller = new UserController();
const router: Router = Router();

router.post('/', verifyActiveAccount,
    checkPermission([PERMISSIONS.USER.CREATE]),
    controller.create);
router.get('/', verifyActiveAccount,
    checkPermission([PERMISSIONS.USER.READ])
    , controller.get);
router.put('/', verifyActiveAccount,
    checkPermission([PERMISSIONS.USER.UPDATE]),
    controller.update);
router.put('/:status', verifyActiveAccount,
    checkStatusPermission("user"),
    controller.updateStatus);
router.delete('/', verifyActiveAccount,
    checkPermission([PERMISSIONS.USER.DELETE]),
    controller.delete);

router.patch("/change-password", verifyActiveAccount,
    controller.changePassword);

//////////////

router.post("/login", controller.login);

router.post("/send-verification-code",
    controller.sendVerificationCode);
router.post("/reset-password",
    controller.resetUser);
router.post("/activate-user",
    controller.activateUser);

export default router;
