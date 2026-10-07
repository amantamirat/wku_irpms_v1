import { Router } from "express";
import { DocumentTemplateService } from "./document-template.service";
import { activityRepo, checkPermission, collaboratorRepo, docTemplateRepo, fileStorageService, grantRepo, phaseRepo, projectRepo } from "../../core/container";
import { DocumentTemplateController } from "./document-template.controller";
import { verifyAuthToken } from "../auth/auth.middleware";
import { AgreementGeneratorService } from "./services/agreementGeneratorService";
import { AgreementDataBuilder } from "./services/agreementDataBuilder";
import { PdfRenderer } from "./services/pdfRenderer";
import { upload } from "../../common/middleware/fileUpload.middleware";
import { PERMISSIONS } from "../../common/constants/permissions";



const service = new DocumentTemplateService(docTemplateRepo, fileStorageService);

const generator = new AgreementGeneratorService(
    phaseRepo, projectRepo, collaboratorRepo, activityRepo, grantRepo, docTemplateRepo, fileStorageService, new AgreementDataBuilder(),
    new PdfRenderer()
);

const controller = new DocumentTemplateController(service, generator);

const router: Router = Router();

//----------------------------------------
// CREATE 
//----------------------------------------

router.post(
    "/",
    verifyAuthToken,
    checkPermission([PERMISSIONS.DOC_TEMPLATE.CREATE]),
    upload.single("file"),
    controller.create
);

//----------------------------------------
// GET
//----------------------------------------

router.get(
    "/",
    verifyAuthToken,
    checkPermission([PERMISSIONS.DOC_TEMPLATE.READ]),
    controller.get
);


router.get(
    "/:phaseId/generate",
    verifyAuthToken,
    // checkPermission([PERMISSIONS.COMPOSITION.READ]),
    controller.generate
);

//----------------------------------------
// LOOKUP COMPOSITIONS
//----------------------------------------

router.get(
    "/lookup",
    verifyAuthToken,
    checkPermission([PERMISSIONS.DOC_TEMPLATE.LOOKUP]),
    controller.get
);

//----------------------------------------
// GET COMPOSITION BY ID
//----------------------------------------

router.get(
    "/:id",
    verifyAuthToken,
    checkPermission([PERMISSIONS.DOC_TEMPLATE.LOOKUP]),
    controller.getById
);

//----------------------------------------
// UPDATE
//----------------------------------------

router.put(
    "/:id",
    verifyAuthToken,
    checkPermission([PERMISSIONS.DOC_TEMPLATE.UPDATE]),
    controller.update
);

//----------------------------------------
// DELETE 
//----------------------------------------

router.delete(
    "/:id",
    verifyAuthToken,
    checkPermission([PERMISSIONS.DOC_TEMPLATE.DELETE]),
    controller.delete
);

export default router;