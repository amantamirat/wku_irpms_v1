import { Router } from "express";
import { ThemeController } from "./theme.controller";

const router = Router();

router.get("/", ThemeController.getThemes);
router.post("/", ThemeController.createTheme);
router.put("/:id", ThemeController.updateTheme);
router.delete("/:id", ThemeController.deleteTheme);

export default router;
