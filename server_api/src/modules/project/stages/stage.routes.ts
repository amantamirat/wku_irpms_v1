import express from "express";
import { ProjectStageController } from "./stage.controller";
import { upload } from "../../../config/multer";


const router = express.Router();

router.post("/", upload.single("document"), ProjectStageController.createProjectStage);
router.get("/", ProjectStageController.getProjectStages);
router.get("/find", ProjectStageController.findProjectStage);
router.put("/:id", ProjectStageController.updateProjectStage);
router.delete("/:id", ProjectStageController.deleteProjectStage);

export default router;
