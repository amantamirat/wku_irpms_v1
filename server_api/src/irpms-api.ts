import express, { Application } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import http from 'http'; // 1. Import the native http module
import organizationRoutes from './modules/organization/organization.routes';

import applicantRoutes from './modules/applicants/applicant.routes';
import positionRoutes from './modules/applicants/positions/position.routes';
import studentRoutes from './modules/applicants/students/student.routes';
import experienceRoutes from './modules/applicants/experiences/experience.routes';
import publicationRoutes from './modules/applicants/publications/publication.routes';
import specializationRoutes from './modules/applicants/specializations/specialization.routes';

import thematicRoutes from './modules/thematics/thematic.routes';
import themeRoutes from './modules/thematics/themes/theme.routes'
import evaluationRoutes from './modules/evaluations/evaluation.routes';
import criterionRoutes from './modules/evaluations/criteria/criterion.routes';
import templateRoutes from './modules/templates/template.routes';

import grantRoutes from './modules/grants/grant.routes';
import grantStageRoutes from './modules/grants/stages/grant.stage.routes';
import constraintRoutes from './modules/grants/constraints/constraint.routes';
import compositionRoutes from './modules/grants/compositions/composition.routes';
import grantAllocationsRoutes from './modules/grants/allocations/grant.allocation.routes';

import calendarRoutes from './modules/calendar/calendar.routes';
import callRoutes from './modules/calls/call.routes';
import callStageRoutes from './modules/calls/stages/call.stage.routes';

import projectRoutes from './modules/projects/project.routes';
import collaboratorRoutes from './modules/projects/collaborators/collaborator.routes';
//import assignmentRoutes from './modules/projects/collaborators/assignment/assignment.routes';
import phaseRoutes from './modules/projects/phase/phase.routes';
import phaseDocRoutes from './modules/projects/phase/documents/phase.doc.routes';

import projectStageRoutes from './modules/projects/stages/project.stage.routes';
import reviewerRoutes from './modules/reviewers/reviewer.routes';
import resultRoutes from './modules/reviewers/results/result.routes';

import userRoutes from './modules/users/user.routes';
import reportRoutes from './modules/reports/report.routes';

import settingRoutes from './modules/settings/setting.routes';
import permissionRoutes from './modules/permissions/permission.routes';
import roleRoutes from './modules/permissions/roles/role.routes';
import authRoutes from './modules/users/auth/auth.routes';
import notificationRoutes from './modules/notifications/notification.routes';

import path from 'path';
import { SeedService } from './util/seed.service';
import { SocketService } from './modules/notifications/socket.service';

dotenv.config();
const app: Application = express();

app.use(cors());
app.use(express.json());

app.use("/api/settings", settingRoutes);
app.use("/api/permissions", permissionRoutes);
app.use("/api/roles", roleRoutes);
app.use("/api/notifications", notificationRoutes);



app.use("/api/users", userRoutes);

app.use("/api/auth", authRoutes);

app.use("/api/organizations", organizationRoutes);
app.use("/api/applicants", applicantRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/publications", publicationRoutes);
app.use("/api/specializations", specializationRoutes);
app.use("/api/positions", positionRoutes);
app.use("/api/experiences", experienceRoutes);


app.use("/api/thematics/themes", themeRoutes);
app.use("/api/thematics", thematicRoutes);
app.use("/api/evaluations", evaluationRoutes);
app.use("/api/criteria", criterionRoutes);
app.use("/api/templates", templateRoutes);

app.use("/api/grants/stages", grantStageRoutes);
app.use("/api/grants/constraints", constraintRoutes);
app.use("/api/grants/compositions", compositionRoutes);
app.use("/api/grants/allocations", grantAllocationsRoutes);
//"More specific routes must come first"
// 🚨 KEEP THIS LAST
app.use("/api/grants", grantRoutes);

app.use("/api/calendars", calendarRoutes);
app.use("/api/calls", callRoutes);
app.use("/api/call/stages", callStageRoutes);
app.use("/api/project/reviewers", reviewerRoutes);
app.use("/api/project/results", resultRoutes);

app.use("/api/projects", projectRoutes);
app.use("/api/project/phases", phaseRoutes);
app.use("/api/project/phase/documents", phaseDocRoutes);
app.use("/api/project/collaborators", collaboratorRoutes);
//app.use("/api/collaborator/assignments", assignmentRoutes);
app.use("/api/project/stages", projectStageRoutes);

app.use("/api/reports", reportRoutes);


app.use("/api/uploads", express.static(path.join(process.cwd(), "uploads")));

const MONGO_URL = process.env.MONGO_URL;
const PORT = process.env.SERVER_PORT || 5000;



(async () => {
  try {
    if (!MONGO_URL) {
      throw new Error('mongo url is not set in environment variables.');
    }

    await mongoose.connect(MONGO_URL);
    console.log('database connection established');

    const seedService = new SeedService();
    await seedService.runAllSeeds();

    // 2. Create the HTTP server explicitly using your Express app
    const httpServer = http.createServer(app);

    // 3. Use the httpServer to listen instead of app.listen
    httpServer.listen(PORT, () => {
      console.log(`Server API is running at http://127.0.0.1:${PORT}`);

      // 4. Initialize SocketService with the httpServer instance
      SocketService.init(httpServer);
      console.log('Socket.io initialized successfully');
    });

  } catch (err) {
    console.error(err);
    console.error('exiting...');
    process.exit(1);
  }
})();

