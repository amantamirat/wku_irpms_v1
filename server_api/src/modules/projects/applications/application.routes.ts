import express from "express";
import { upload } from "../../../util/multer";
import { GrantStageRepository } from "../../grants/stages/grant.stage.repository";
import { checkPermission, checkTransitionPermission, verifyActiveAccount } from "../../auth/auth.middleware";
import { ProjectRepository } from "../project.repository";
import { ApplicationController } from "./application.controller";
import { ApplicationRepository } from "./application.repository";
import { ApplicationService } from "./application.service";
import { GrantAllocationRepository } from "../../grants/allocations/grant.allocation.repository";
import { ProjectStageSynchronizer } from "./application.synchronizer";
import { ReviewerRepository } from "../../reviewers/reviewer.repository";
import { SettingRepository } from "../../settings/setting.repository";
import { SettingService } from "../../settings/setting.service";
import { NotificationService } from "../../notifications/notification.service";
import { NotificationRepository } from "../../notifications/notification.repository";
import { ProjectAuth } from "../project.auth";
import { StageRepository } from "../../calls/stages/stage.repository";
import { applicationService } from "../../../core/container";

const projectStageRepo = new ApplicationRepository();
const projectRepo = new ProjectRepository();
const projAuth = new ProjectAuth(projectRepo);
const grantStageRepo = new GrantStageRepository();
const callStageRepo = new StageRepository();
const reviewerRepoRepo = new ReviewerRepository();
const synchronizer = new ProjectStageSynchronizer(projectRepo, projectStageRepo, grantStageRepo);
const notificationService = new NotificationService(
    new NotificationRepository(),
    new SettingService(new SettingRepository())
);

const controller = new ApplicationController(applicationService);
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
