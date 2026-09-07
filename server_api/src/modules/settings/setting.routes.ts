import { Router } from "express";
import { checkPermission, settingService } from '../../core/container';
import { verifyActiveAccount } from "../auth/auth.middleware";
import { SettingController } from "./setting.controller";

const router = Router();
const controller = new SettingController(settingService);


router.get("/", verifyActiveAccount,
    //checkPermission(["setting:read"]),
    (req, res) => controller.getAllSettings(req, res));

router.patch("/:key",
    verifyActiveAccount,
    checkPermission(["setting:update"]),
    (req, res) => controller.update(req, res));

export default router;