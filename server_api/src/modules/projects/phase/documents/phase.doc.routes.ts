import { Router } from "express";
import { PERMISSIONS } from "../../../../common/constants/permissions";
import { upload } from "../../../../common/middleware/fileUpload.middleware";
import { activityRepo, checkPermission, checkTransitionPermission, fileStorageService, phaseDocRepo, phaseRepo, projectAuth } from '../../../../core/container';
import { verifyAuthToken } from "../../../auth/auth.middleware";
import { PhaseDocumentController } from "./phase.doc.controller";
import { PhaseDocumentService } from "./phase.doc.service";

const controller = new PhaseDocumentController(new PhaseDocumentService(
    phaseDocRepo, phaseRepo, activityRepo, projectAuth, fileStorageService));
const router: Router = Router();

router.post('/', verifyAuthToken,
    checkPermission([PERMISSIONS.PHASE_DOCUMENT.CREATE,
    PERMISSIONS.PHASE_DOCUMENT.CREATE_OWN
    ]),
    upload.single("file"),
    controller.create);

router.get('/', verifyAuthToken,
    checkPermission([PERMISSIONS.PHASE_DOCUMENT.READ]),
    controller.get);

router.get(
    "/lookup",
    verifyAuthToken,
    checkPermission(
        PERMISSIONS.PHASE_DOCUMENT.LOOKUP
    ),
    controller.get
);
/*    
router.put('/', verifyActiveAccount,
    checkPermission([PERMISSIONS.PHASE.UPDATE]),
    controller.update);*/

// ---------------------------------------------------
// Transition
// ---------------------------------------------------

router.patch(
    "/:id",
    verifyAuthToken,
    checkTransitionPermission(
        "phaseDocument"
    ),
    controller.transitionState
);

router.delete('/:id', verifyAuthToken,
    checkPermission([PERMISSIONS.PHASE_DOCUMENT.DELETE, PERMISSIONS.PHASE_DOCUMENT.DELETE_OWN]),
    controller.delete);

export default router;