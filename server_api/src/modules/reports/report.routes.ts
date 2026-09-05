// report.routes.ts

import { Router } from "express";

import { ReportRepository } from "./report.repository";
import { ReportService } from "./report.service";
import { ReportController } from "./report.controller";

import {
    verifyActiveAccount
} from "../auth/auth.middleware";
import { checkPermission } from '../../core/container';

import { PERMISSIONS } from "../../common/constants/permissions";


const router: Router = Router();

const repository =
    new ReportRepository();

const service =
    new ReportService(repository);

const controller =
    new ReportController(service);


// All report endpoints require authentication
// and report overview permission.
router.use(
    verifyActiveAccount,
    checkPermission([
        PERMISSIONS.REPORT.OVERVIEW
    ])
);


router.get(
    "/dashboard",
    controller.getDashboard
);

router.get(
    "/portfolio",
    controller.getPortfolio
);

router.get(
    "/applications",
    controller.getApplications
);

router.get(
    "/evaluation",
    controller.getEvaluation
);
/*
router.get(
    "/financial",
    controller.getFinancial
);
*/
/*
router.get(
    "/phases",
    controller.getPhases
);
*/

router.get(
    "/departments",
    controller.getDepartments
);


export default router;