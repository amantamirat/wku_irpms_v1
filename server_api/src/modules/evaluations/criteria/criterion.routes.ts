import { Router } from "express";
import { criterionRepo, evaluationRepo } from "../../../core/container";
import { upload } from "../../../util/multer";
import { verifyActiveAccount } from "../../auth/auth.middleware";
import { checkPermission } from '../../../core/container';
import { CriterionController } from "./criterion.controller";
import { CriterionService } from "./criterion.service";

//const repository = new CriterionRepository();
//const resultRepo = new ResultRepository();
//const evalRepo = new EvaluationRepository();
const service = new CriterionService(criterionRepo, //resultRepo, 
    evaluationRepo,
   // new SettingService(new SettingRepository())
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

/*
// Batch import criteria with options
router.post(
    "/import/:id",
    verifyActiveAccount,
    checkPermission("criterion:import"),
    upload.single('file'),
    controller.import
);
*/
export default router;
