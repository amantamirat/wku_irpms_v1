import { Router } from 'express';
import { AuthController } from './auth.controller';
import { checkPermission, checkStatusPermission, verifyActiveAccount } from './auth.middleware';
import { PERMISSIONS } from '../../../common/constants/permissions';


const controller = new AuthController();
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

///////////////////////////////////////

router.post("/login", controller.login);

router.post("/send-verification-code",
    controller.sendVerificationCode);

router.post("/reset-password",
    controller.resetAuth);

router.post("/activate-user",
    controller.activateAuth);

export default router;
