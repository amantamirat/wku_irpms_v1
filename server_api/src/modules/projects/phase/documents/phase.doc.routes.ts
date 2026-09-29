import { Router } from "express";
import { PERMISSIONS } from "../../../../common/constants/permissions";
import { checkPermission, fileStorageService, phaseRepo } from '../../../../core/container';
import { upload } from "../../../../common/middleware/fileUpload.middleware";
import { verifyAuthToken } from "../../../auth/auth.middleware";
import { PhaseDocumentController } from "./phase.doc.controller";
import { PhaseDocumentRepository } from "./phase.doc.repository";
import { PhaseDocumentService } from "./phase.doc.service";

const controller = new PhaseDocumentController(new PhaseDocumentService(
    new PhaseDocumentRepository(), phaseRepo, fileStorageService));
const router: Router = Router();

router.post('/', verifyAuthToken,
    checkPermission([PERMISSIONS.PHASE_DOCUMENT.CREATE]),
    upload.single("file"),
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