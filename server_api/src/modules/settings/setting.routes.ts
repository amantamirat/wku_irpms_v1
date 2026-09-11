import { Router } from "express";
import { checkPermission, settingService } from '../../core/container';
import { verifyAuthToken } from "../auth/auth.middleware";
import { SettingController } from "./setting.controller";

const router = Router();
const controller = new SettingController(settingService);


router.get("/", verifyAuthToken,
    //checkPermission(["setting:read"]),
    (req, res) => controller.getAllSettings(req, res));

router.patch("/:key",
    verifyAuthToken,
    checkPermission(["setting:update"]),
    (req, res) => controller.update(req, res));

export default router;