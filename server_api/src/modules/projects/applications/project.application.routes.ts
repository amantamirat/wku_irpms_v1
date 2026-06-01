import express from "express";
import { upload } from "../../../util/multer";
import { GrantStageRepository } from "../../grants/stages/grant.stage.repository";
import { checkPermission, checkTransitionPermission, verifyActiveAccount } from "../../auth/auth.middleware";
import { ProjectRepository } from "../project.repository";
import { ProjectStageController } from "./project.application.controller";
import { ProjectApplicationRepository } from "./project.application.repository";
import { ProjectApplicationService } from "./project.application.service";
import { GrantAllocationRepository } from "../../grants/allocations/grant.allocation.repository";
import { ProjectStageSynchronizer } from "./project.application.synchronizer";
import { ReviewerRepository } from "../../reviewers/reviewer.repository";
import { SettingRepository } from "../../settings/setting.repository";
import { SettingService } from "../../settings/setting.service";
import { NotificationService } from "../../notifications/notification.service";
import { NotificationRepository } from "../../notifications/notification.repository";
import { ProjectAuth } from "../project.auth";
import { CallStageRepository } from "../../calls/stages/call.stage.repository";

const projectStageRepo = new ProjectApplicationRepository();
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
const service = new ProjectApplicationService(projectStageRepo, projAuth,
    grantStageRepo, callStageRepo,
    reviewerRepoRepo, synchronizer, notificationService);
const controller = new ProjectStageController(service);
const router = express.Router();

router.post(
    "/",
    verifyActiveAccount,
    checkPermission("project.application:create"),
    (req, res, next) => {
        // Set the dynamic subfolder for this specific endpoint
        req.headers["x-upload-folder"] = "applications";
        next();
    },
    upload.single("document"),
    controller.create
);

router.get(
    "/",
    verifyActiveAccount,
    checkPermission("project.application:read"),
    controller.get
);

router.get(
    "/:id",
    verifyActiveAccount,
    checkPermission("project.application:read"),
    controller.getById
);

router.post(
    "/:id/calculate-score",
    verifyActiveAccount,
    checkPermission("project.application:calculateTotalScore"),
    controller.calculateTotalScore
);

/*
router.patch(
    "/",
    verifyActiveAccount,
    checkStatusPermission("document"),
    controller.updateStatus
);
*/

router.patch(
    "/:id/transition",
    verifyActiveAccount,
    checkTransitionPermission("project.application"),
    controller.transitionState
);

router.delete(
    "/:id",
    verifyActiveAccount,
    checkPermission("project.application:delete"),
    controller.delete
);

export default router;
