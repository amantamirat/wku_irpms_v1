import path from 'path';
import cors from 'cors';
import dotenv from 'dotenv';
import http from 'http'; // 1. Import the native http module
import mongoose from 'mongoose';

import express, { Application, Request, Response, NextFunction } from "express";
import multer from "multer";
import { AppError } from "./common/errors/app.error";
import { ERROR_CODES } from "./common/errors/error.codes";


import organizationRoutes from './modules/organization/organization.routes';
import specializationRoutes from './modules/organization/specializations/specialization.routes';
import positionRoutes from './modules/positions/position.routes';
import enrollmentRoutes from './modules/users/enrollments/enrollment.routes';
import experienceRoutes from './modules/users/experiences/experience.routes';
import publicationRoutes from './modules/users/publications/publication.routes';
import userRoutes from './modules/users/user.routes';

import criterionRoutes from './modules/evaluations/criteria/criterion.routes';
import evaluationRoutes from './modules/evaluations/evaluation.routes';
import templateRoutes from './modules/templates/template.routes';
import thematicRoutes from './modules/thematics/thematic.routes';
import themeRoutes from './modules/thematics/themes/theme.routes';

import grantRoutes from './modules/grants/grant.routes';
import verificationConfRoutes from './modules/grants/verification-conf/verification-conf.routes';
import verificationRoutes from './modules/grants/verifications/verification.routes';


import compositionRoutes from './modules/compositions/composition.routes';
import constraintRoutes from './modules/constraints/constraint.routes';

import historyRoutes from './modules/compositions/history/history.routes';
import profileRoutes from './modules/compositions/profile/profile.routes';
import requirementRoutes from './modules/compositions/requirements/requirement.routes';

import calendarRoutes from './modules/calendar/calendar.routes';
import callRoutes from './modules/calls/call.routes';
import callStageRoutes from './modules/calls/stages/stage.routes';

import collaboratorRoutes from './modules/projects/collaborators/collaborator.routes';
import projectRoutes from './modules/projects/project.routes';

import phaseDocRoutes from './modules/projects/phase/documents/phase.doc.routes';
import phaseActivityRoutes from './modules/projects/phase/activities/phase-activity.routes';
import phaseEquipmentRoutes from './modules/projects/phase/equipments/phase-equipment.routes';
import phaseRoutes from './modules/projects/phase/phase.routes';

import applicationRoutes from './modules/projects/applications/application.routes';
import resultRoutes from './modules/reviewers/results/result.routes';
import reviewerRoutes from './modules/reviewers/reviewer.routes';

import accountRoutes from './modules/accounts/account.routes';
import reportRoutes from './modules/reports/report.routes';

import authRoutes from './modules/auth/auth.routes';
import notificationRoutes from './modules/notifications/notification.routes';
import permissionRoutes from './modules/permissions/permission.routes';
import roleRoutes from './modules/permissions/roles/role.routes';
import settingRoutes from './modules/settings/setting.routes';


import { SocketService } from './modules/notifications/socket.service';
import { errorResponse } from './common/helpers/response';

dotenv.config();
const app: Application = express();

app.use(cors());
app.use(express.json());

app.use("/api/settings", settingRoutes);
app.use("/api/permissions", permissionRoutes);
app.use("/api/roles", roleRoutes);
app.use("/api/notifications", notificationRoutes);



app.use("/api/accounts", accountRoutes);

app.use("/api/auth", authRoutes);

app.use("/api/organizations", organizationRoutes);
app.use("/api/users", userRoutes);
app.use("/api/enrollments", enrollmentRoutes);
app.use("/api/publications", publicationRoutes);
app.use("/api/specializations", specializationRoutes);
app.use("/api/positions", positionRoutes);
app.use("/api/experiences", experienceRoutes);


app.use("/api/thematics/themes", themeRoutes);
app.use("/api/thematics", thematicRoutes);
app.use("/api/evaluations", evaluationRoutes);
app.use("/api/criteria", criterionRoutes);
app.use("/api/templates", templateRoutes);
app.use("/api/constraints", constraintRoutes);


app.use("/api/compositions", compositionRoutes);
app.use("/api/team/profiles", profileRoutes);
app.use("/api/team/histories", historyRoutes);
app.use("/api/team/requirements", requirementRoutes)

//"More specific routes must come first"
// 🚨 KEEP THIS LAST
app.use("/api/grants", grantRoutes);

app.use("/api/verification-configurations", verificationConfRoutes);
app.use("/api/verifications", verificationRoutes);

app.use("/api/calendars", calendarRoutes);
app.use("/api/calls", callRoutes);
app.use("/api/call/stages", callStageRoutes);
app.use("/api/project/reviewers", reviewerRoutes);
app.use("/api/project/results", resultRoutes);

app.use("/api/projects", projectRoutes);
app.use("/api/project/phases", phaseRoutes);
app.use("/api/project/phases/activities", phaseActivityRoutes);
app.use("/api/project/phase/documents", phaseDocRoutes);
app.use("/api/project/phases/equipments", phaseEquipmentRoutes);
app.use("/api/project/collaborators", collaboratorRoutes);
//app.use("/api/collaborator/assignments", assignmentRoutes);
app.use("/api/project/applications", applicationRoutes);

app.use("/api/reports", reportRoutes);

app.use("/api/uploads", express.static(path.join(process.cwd(), "uploads")));


// ---- Global error handler (must be LAST, after all routes) ----
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {

  if (err instanceof AppError) {
    const status =
      err.code === ERROR_CODES.FILE_TOO_LARGE ? 413 :
        err.code === ERROR_CODES.INVALID_FILE_FORMAT ? 415 :
          (err as any).statusCode ?? 400;

    return errorResponse(res, status, err.message, err);
  }

  if (err instanceof multer.MulterError) {
    return errorResponse(res, 400, "File upload failed", err.message);
  }

  return errorResponse(res, 500, "Internal server error", err);
});

const MONGO_URL = process.env.MONGO_URL;
const PORT = Number(process.env.SERVER_PORT) || 5000;
const HOST = process.env.HOST || 'localhost';

(async () => {
  try {
    if (!MONGO_URL) {
      throw new Error('mongo url is not set in environment variables.');
    }

    await mongoose.connect(MONGO_URL);
    console.log('database connection established');

    const httpServer = http.createServer(app);

    httpServer.listen(PORT, HOST, () => {
      console.log(`Server API is running at http://${HOST}:${PORT}`);

      SocketService.init(httpServer);
      console.log('Socket.io initialized successfully');
    });

  } catch (err) {
    console.error(err);
    console.error('exiting...');
    process.exit(1);
  }
})();

