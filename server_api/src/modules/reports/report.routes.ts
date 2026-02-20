import { Router } from "express";
import { ReportController } from "./report.controller";
import { verifyActiveAccount } from "../users/user.middleware";

const controller = new ReportController();
const router: Router = Router();

router.post('/', verifyActiveAccount,
    //checkPermission([PERMISSIONS.PROJECT.READ]),
    controller.getOverview);

export default router;