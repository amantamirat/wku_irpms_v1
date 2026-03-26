import { Router } from "express";
import { PERMISSIONS } from "../../../common/constants/permissions";
import { checkPermission, verifyActiveAccount } from "../../users/auth/auth.middleware";
import { CriterionController } from "./criterion.controller";
import { CriterionService } from "./criterion.service";
import { CriterionRepository } from "./criterion.repository";
import { ResultRepository } from "../../calls/stages/reviewers/results/result.repository";
import { EvaluationRepository } from "../evaluation.repository";
import { SettingService } from "../../settings/setting.service";
import { SettingRepository } from "../../settings/setting.repository";
import { upload } from "../../../util/multer";

const repository = new CriterionRepository();
//const resultRepo = new ResultRepository();
const evalRepo = new EvaluationRepository();
const service = new CriterionService(repository, //resultRepo, 
    evalRepo,
    new SettingService(new SettingRepository())
);
const controller = new CriterionController(service);
const router = Router();

// Create a single criterion
router.post(
    "/",
    verifyActiveAccount,
    checkPermission("criterion:create"),
    controller.create
);

// Get all criteria for an evaluation
router.get(
    "/",
    verifyActiveAccount,
    checkPermission("criterion:read"),
    controller.getAll
);

// Update a criterion
router.put(
    "/:id",
    verifyActiveAccount,
    checkPermission("criterion:update"),
    controller.update
);

// Delete a criterion
router.delete(
    "/:id",
    verifyActiveAccount,
    checkPermission("criterion:delete"),
    controller.delete
);

// Batch import criteria with options
router.post(
    "/import/:id",
    verifyActiveAccount,
    checkPermission("criterion:import"),
    upload.single('file'),
    controller.import
);

export default router;
