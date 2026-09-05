import { Router } from "express";
import { PositionController } from "./position.controller";
import { verifyActiveAccount } from "../auth/auth.middleware";
import { checkPermission } from '../../core/container';
import { PERMISSIONS } from "../../common/constants/permissions";
import { PositionService } from "./position.service";
import { exprienceRepo, positionRepo } from "../../core/container";

const router = Router();

const positionService = new PositionService(positionRepo, exprienceRepo);
const controller = new PositionController(positionService);

router.post("/", verifyActiveAccount, checkPermission([PERMISSIONS.POSITION.CREATE]), controller.create);
router.get("/", verifyActiveAccount, checkPermission([PERMISSIONS.POSITION.READ]), controller.get);
router.put("/:id", verifyActiveAccount, checkPermission([PERMISSIONS.POSITION.UPDATE]), controller.update);
router.delete("/:id", verifyActiveAccount, checkPermission([PERMISSIONS.POSITION.DELETE]), controller.delete);

export default router;
