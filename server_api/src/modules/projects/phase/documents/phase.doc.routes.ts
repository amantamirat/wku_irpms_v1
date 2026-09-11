import { Router } from "express";
import { PERMISSIONS } from "../../../../common/constants/permissions";
import { verifyAuthToken } from "../../../auth/auth.middleware";
import { checkPermission } from '../../../../core/container';
import { PhaseDocController } from "./phase.doc.controller";
import { upload } from "../../../../util/multer";

const controller = new PhaseDocController();
const router: Router = Router();

router.post('/', verifyAuthToken,
    checkPermission([PERMISSIONS.PHASE_DOCUMENT.CREATE]),
    upload.single("document"),
    controller.create);

router.get('/', verifyAuthToken,
    checkPermission([PERMISSIONS.PHASE_DOCUMENT.READ]),
    controller.get);
/*    
router.put('/', verifyActiveAccount,
    checkPermission([PERMISSIONS.PHASE.UPDATE]),
    controller.update);*/

router.delete('/:id', verifyAuthToken,
    checkPermission([PERMISSIONS.PHASE_DOCUMENT.DELETE]),
    controller.delete);

export default router;