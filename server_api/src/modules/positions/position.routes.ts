import { Router } from "express";
import { PositionController } from "./position.controller";
import { verifyAuthToken } from "../auth/auth.middleware";
import { checkPermission } from '../../core/container';
import { PERMISSIONS } from "../../common/constants/permissions";
import { PositionService } from "./position.service";
import { exprienceRepo, positionRepo } from "../../core/container";

const router = Router();

const positionService = new PositionService(positionRepo, exprienceRepo);
const controller = new PositionController(positionService);

router.post("/", verifyAuthToken, checkPermission([PERMISSIONS.POSITION.CREATE]), controller.create);
router.get("/lookup", verifyAuthToken, checkPermission([PERMISSIONS.POSITION.LOOKUP]), controller.get);
router.get("/", verifyAuthToken, checkPermission([PERMISSIONS.POSITION.READ]), controller.get);
router.put("/:id", verifyAuthToken, checkPermission([PERMISSIONS.POSITION.UPDATE]), controller.update);
router.delete("/:id", verifyAuthToken, checkPermission([PERMISSIONS.POSITION.DELETE]), controller.delete);

export default router;
