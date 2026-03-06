import { Router } from "express";
import { PERMISSIONS } from "../../../../common/constants/permissions";
import { verifyActiveAccount, checkPermission } from "../../../users/user.middleware";
import { PhaseDocController } from "./phase.doc.controller";
import { upload } from "../../../../util/multer";

const controller = new PhaseDocController();
const router: Router = Router();

router.post('/', verifyActiveAccount,
    checkPermission([PERMISSIONS.PHASE_DOCUMENT.CREATE]),
    upload.single("document"),
    controller.create);

router.get('/', verifyActiveAccount,
    checkPermission([PERMISSIONS.PHASE_DOCUMENT.READ]),
    controller.get);
/*    
router.put('/', verifyActiveAccount,
    checkPermission([PERMISSIONS.PHASE.UPDATE]),
    controller.update);*/

router.delete('/:id', verifyActiveAccount,
    checkPermission([PERMISSIONS.PHASE_DOCUMENT.DELETE]),
    controller.delete);

export default router;