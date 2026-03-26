import { Router } from "express";
import { SettingController } from "./setting.controller";
import { SettingService } from "./setting.service";
import { SettingRepository } from "./setting.repository";
import { checkPermission, verifyActiveAccount } from "../users/auth/auth.middleware";

const router = Router();

// Dependency Injection
const repo = new SettingRepository();
const service = new SettingService(repo);
const controller = new SettingController(service);


router.get("/", verifyActiveAccount,
    //checkPermission(["setting:read"]),
    (req, res) => controller.getAllSettings(req, res));

router.patch("/:key",
    verifyActiveAccount,
    checkPermission(["setting:update"]),
    (req, res) => controller.update(req, res));

export default router;