import express from "express";
import { upload } from "../../../util/multer";
import { GrantStageRepository } from "../../grants/stages/grant.stage.repository";
import { checkPermission, checkTransitionPermission, verifyActiveAccount } from "../../users/auth/auth.middleware";
import { ProjectRepository } from "../project.repository";
import { ProjectStageController } from "./project.stage.controller";
import { ProjectStageRepository } from "./project.stage.repository";
import { ProjectStageService } from "./project.stage.service";
import { GrantAllocationRepository } from "../../grants/allocations/grant.allocation.repository";
import { ProjectStageSynchronizer } from "./project.stage.synchronizer";

const projectStageRepo = new ProjectStageRepository();
const projectRepo = new ProjectRepository();
const grantStageRepo = new GrantStageRepository();
const grantAllocationRepo = new GrantAllocationRepository();
const synchronizer = new ProjectStageSynchronizer(projectRepo, projectStageRepo);

const service = new ProjectStageService(projectStageRepo, projectRepo, grantStageRepo, grantAllocationRepo, synchronizer);
const controller = new ProjectStageController(service);
const router = express.Router();

router.post("/", verifyActiveAccount,
    checkPermission("project.stage:create"),
    upload.single("document"), controller.create);

router.get("/", verifyActiveAccount,
    checkPermission("project.stage:read"),
    controller.get);

router.get('/:id', verifyActiveAccount,
    checkPermission("project.stage:read"),
    controller.getById
);

/*
router.post("/submit", verifyActiveAccount,
    checkPermission([PERMISSIONS.DOCUMENT.SUBMIT]),
    upload.single("document"), controller.submit);

router.patch("/", verifyActiveAccount,
    checkStatusPermission("document"),
    controller.updateStatus);
*/

router.patch(
    '/:id/transition', // Often better to have a specific sub-route for transitions
    verifyActiveAccount,
    checkTransitionPermission("project.stage"),
    controller.transitionState
);
router.delete("/:id", verifyActiveAccount,
    checkPermission("project.stage:delete"),
    controller.delete);

export default router;
