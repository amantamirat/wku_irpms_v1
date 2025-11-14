import express from "express";
import { ProjectStageController } from "./project.stage.controller";
import { upload } from "../../../../util/multer";


const router = express.Router();

router.post("/", upload.single("document"), ProjectStageController.createProjectStage);
router.get("/", ProjectStageController.getProjectStages);
router.put("/:id", ProjectStageController.updateProjectStage);
router.delete("/:id", ProjectStageController.deleteProjectStage);

export default router;
