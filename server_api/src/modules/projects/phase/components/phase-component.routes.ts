import { Router } from "express";
import { PERMISSIONS } from "../../../../common/constants/permissions";
import { checkPermission, projectComponentService } from "../../../../core/container";
import { verifyAuthToken } from "../../../auth/auth.middleware";
import { ProjectComponentController } from "./phase-component.controller";

const controller = new ProjectComponentController(projectComponentService);
const router: Router = Router();

router.get("/", verifyAuthToken, checkPermission(PERMISSIONS.PHASE_ACTIVITY.READ), controller.get);
router.get("/lookup", verifyAuthToken, checkPermission(PERMISSIONS.PHASE_ACTIVITY.LOOKUP), controller.get);
router.post("/", verifyAuthToken, checkPermission([
    PERMISSIONS.PHASE_ACTIVITY.CREATE,
    PERMISSIONS.PHASE_ACTIVITY.CREATE_OWN,
]), controller.create);
router.put("/:id", verifyAuthToken, checkPermission([
    PERMISSIONS.PHASE_ACTIVITY.UPDATE,
    PERMISSIONS.PHASE_ACTIVITY.UPDATE_OWN,
]), controller.update);
router.delete("/:id", verifyAuthToken, checkPermission([
    PERMISSIONS.PHASE_ACTIVITY.DELETE,
    PERMISSIONS.PHASE_ACTIVITY.DELETE_OWN,
]), controller.delete);

export default router;
