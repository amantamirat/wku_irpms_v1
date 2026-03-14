import express from "express";
import { ProjectDocController } from "./document.controller";
import { upload } from "../../../util/multer";
import { checkPermission, checkStatusPermission, verifyActiveAccount } from "../../users/auth/auth.middleware";
import { PERMISSIONS } from "../../../common/constants/permissions";
import { StageRepository } from "../../calls/stages/stage.repository";
import { ProjectRepository } from "../project.repository";
import { DocumentRepository } from "./document.repository";
import { DocumentService } from "./document.service";

const repository = new DocumentRepository();
const projectRepository = new ProjectRepository();
const stageRepository = new StageRepository();

const service = new DocumentService(repository, projectRepository, stageRepository);
const controller = new ProjectDocController(service);
const router = express.Router();

router.post("/", verifyActiveAccount,
    checkPermission([PERMISSIONS.DOCUMENT.CREATE]),
    upload.single("document"), controller.create);

router.get("/", verifyActiveAccount,
    checkPermission([PERMISSIONS.DOCUMENT.READ]),
    controller.get);

router.get('/:id', verifyActiveAccount,
    checkPermission([PERMISSIONS.DOCUMENT.READ]),
    controller.getById
);

router.post("/submit", verifyActiveAccount,
    checkPermission([PERMISSIONS.DOCUMENT.SUBMIT]),
    upload.single("document"), controller.submit);

router.patch("/", verifyActiveAccount,
    checkStatusPermission("document"),
    controller.updateStatus);

router.delete("/:id", verifyActiveAccount,
    checkPermission([PERMISSIONS.DOCUMENT.DELETE]),
    controller.delete);

export default router;
