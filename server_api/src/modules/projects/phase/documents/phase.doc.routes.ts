import { Router } from "express";
import { PERMISSIONS } from "../../../../common/constants/permissions";
import { verifyActiveAccount, checkPermission} from "../../../users/user.middleware";
import { PhaseDocController } from "./phase.doc.controller";

const controller = new PhaseDocController();
const router: Router = Router();

router.post('/', verifyActiveAccount,
    checkPermission([PERMISSIONS.PHASE.CREATE]),
    controller.create);

router.get('/', verifyActiveAccount,
    checkPermission([PERMISSIONS.PHASE.READ]),
    controller.get);
/*    
router.put('/', verifyActiveAccount,
    checkPermission([PERMISSIONS.PHASE.UPDATE]),
    controller.update);*/

router.delete('/:id', verifyActiveAccount,
    checkPermission([PERMISSIONS.PHASE.DELETE]),
    controller.delete);

export default router;