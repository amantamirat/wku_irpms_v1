import { Router } from "express";
import { ThemeController } from "./theme.controller";
import { verifyActiveAccount } from "../users/auth/auth.middleware";

const router = Router();

router.get("/", verifyActiveAccount, ThemeController.getThemes);
router.post("/", verifyActiveAccount, ThemeController.createTheme);
router.put("/:id", verifyActiveAccount, ThemeController.updateTheme);
router.delete("/:id", verifyActiveAccount, ThemeController.deleteTheme);

export default router;
