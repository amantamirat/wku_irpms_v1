import express from "express";
import { upload } from "../../../util/multer";
import { GrantStageRepository } from "../../grants/stages/grant.stage.repository";
import { checkPermission, checkTransitionPermission, verifyActiveAccount } from "../../auth/auth.middleware";
import { ProjectRepository } from "../project.repository";
import { ProjectStageController } from "./project.stage.controller";
import { ProjectStageRepository } from "./project.stage.repository";
import { ProjectStageService } from "./project.stage.service";
import { GrantAllocationRepository } from "../../grants/allocations/grant.allocation.repository";
import { ProjectStageSynchronizer } from "./project.stage.synchronizer";
import { ReviewerRepository } from "../../reviewers/reviewer.repository";
import { SettingRepository } from "../../settings/setting.repository";
import { SettingService } from "../../settings/setting.service";
import { NotificationService } from "../../notifications/notification.service";
import { NotificationRepository } from "../../notifications/notification.repository";
import { ProjectAuth } from "../project.auth";
import { CallStageRepository } from "../../calls/stages/call.stage.repository";

const projectStageRepo = new ProjectStageRepository();
const projectRepo = new ProjectRepository();
const projAuth = new ProjectAuth(projectRepo);
const grantStageRepo = new GrantStageRepository();
const callStageRepo = new CallStageRepository();
const reviewerRepoRepo = new ReviewerRepository();
const synchronizer = new ProjectStageSynchronizer(projectRepo, projectStageRepo, grantStageRepo);
const notificationService = new NotificationService(
    new NotificationRepository(),
    new SettingService(new SettingRepository())
);
const service = new ProjectStageService(projectStageRepo, projAuth,
    grantStageRepo, callStageRepo,
    reviewerRepoRepo, synchronizer, notificationService);
const controller = new ProjectStageController(service);
const router = express.Router();

router.post("/", verifyActiveAccount,
    checkPermission("project.stage:create"),
    (req, res, next) => {
        // Set the dynamic subfolder for this specific endpoint
        req.headers["x-upload-folder"] = "applications";
        next();
    },
    upload.single("document"), controller.create);

router.get("/", verifyActiveAccount,
    checkPermission("project.stage:read"),
    controller.get);

router.get('/:id', verifyActiveAccount,
    checkPermission("project.stage:read"),
    controller.getById
);

router.post(
    "/:id/calculate-score",
    verifyActiveAccount,
    checkPermission("project.stage:calculateTotalScore"),
    controller.calculateTotalScore
);

/*
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
