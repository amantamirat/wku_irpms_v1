import express from "express";
import { ProjectStageController } from "./project-stage.controller";
import { upload } from "../../../../util/multer";
import { verifyActiveAccount } from "../../../users/auth/auth.middleware";


const router = express.Router();

router.post("/", verifyActiveAccount,
    upload.single("document"), ProjectStageController.createProjectStage);
router.get("/", verifyActiveAccount,
    ProjectStageController.getProjectStages);
router.put("/:id", verifyActiveAccount,
    ProjectStageController.updateProjectStage);
router.delete("/:id", verifyActiveAccount,
    ProjectStageController.deleteProjectStage);

export default router;
