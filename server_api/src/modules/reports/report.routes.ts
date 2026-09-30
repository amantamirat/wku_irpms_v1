// report.routes.ts

import { Router } from "express";

import { ReportRepository } from "./report.repository";
import { ReportService } from "./report.service";
import { ReportController } from "./report.controller";

import {
    verifyAuthToken
} from "../auth/auth.middleware";
import { checkPermission, fileStorageService, filterService } from '../../core/container';

import { PERMISSIONS } from "../../common/constants/permissions";



const router: Router = Router();

const repository = new ReportRepository();
const service = new ReportService(repository, filterService);
const controller = new ReportController(service);

// All report endpoints require authentication
router.use(verifyAuthToken);

// Dashboard requires dashboard permission
router.get(
    "/dashboard",
    checkPermission([
        PERMISSIONS.REPORT.DASHBOARD
    ]),
    controller.getDashboard
);

// Other reports require overview permission
router.get(
    "/portfolio",
    checkPermission([
        PERMISSIONS.REPORT.OVERVIEW
    ]),
    controller.getPortfolio
);

router.get(
    "/applications",
    checkPermission([
        PERMISSIONS.REPORT.OVERVIEW
    ]),
    controller.getApplications
);

router.get(
    "/verifications",
    checkPermission([
        PERMISSIONS.REPORT.OVERVIEW
    ]),
    controller.getVerifications
);

router.get(
    "/evaluations",
    checkPermission([
        PERMISSIONS.REPORT.OVERVIEW
    ]),
    controller.getEvaluations
);

router.get(
    "/departments",
    checkPermission([
        PERMISSIONS.REPORT.OVERVIEW
    ]),
    controller.getDepartments
);

/////////////////////////////////////////////////////

router.get(
    "/directorates",
    checkPermission([
        PERMISSIONS.REPORT.OVERVIEW
    ]),
    controller.getDirectorateReport
);

router.get(
    "/financial",
    checkPermission([
        PERMISSIONS.REPORT.OVERVIEW
    ]),
    controller.getFinancial
);

export default router;