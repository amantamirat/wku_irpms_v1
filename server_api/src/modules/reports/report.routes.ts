import { Router } from "express";
import { ReportController } from "./report.controller";
import { checkPermission, verifyActiveAccount } from "../users/user.middleware";
import { PERMISSIONS } from "../../common/constants/permissions";

const controller = new ReportController();
const router: Router = Router();

router.post('/', verifyActiveAccount,
    checkPermission([PERMISSIONS.REPORT.OVERVIEW]),
    controller.getOverview);

export default router;