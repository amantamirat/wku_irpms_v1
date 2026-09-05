import { Router } from "express";
import { PERMISSIONS } from "../../../common/constants/permissions";
import { historyRepo } from "../../../core/container";
import { verifyActiveAccount } from "../../auth/auth.middleware";
import { checkPermission } from '../../../core/container';
import { HistoryController } from "./history.controller";
import { HistoryService } from "./history.service";

const service = new HistoryService(historyRepo);
const controller = new HistoryController(service);

const router: Router = Router();

//----------------------------------------
// CREATE COMPOSITION
//----------------------------------------
router.post(
    "/",
    verifyActiveAccount,
    checkPermission([PERMISSIONS.COMPOSITION.CREATE]),
    controller.create
);

router.get(
    "/:id",
    verifyActiveAccount,
    checkPermission([PERMISSIONS.COMPOSITION.READ]),
    controller.getById
)

//----------------------------------------
// GET 
//----------------------------------------
router.get(
    "/",
    verifyActiveAccount,
    checkPermission([PERMISSIONS.COMPOSITION.READ]),
    controller.get
);

//----------------------------------------
// UPDATE 
//----------------------------------------
router.put(
    "/:id",
    verifyActiveAccount,
    checkPermission([PERMISSIONS.COMPOSITION.UPDATE]),
    controller.update
);

//----------------------------------------
// DELETE COMPOSITION
//----------------------------------------
router.delete(
    "/:id",
    verifyActiveAccount,
    checkPermission([PERMISSIONS.COMPOSITION.DELETE]),
    controller.delete
);

export default router;
