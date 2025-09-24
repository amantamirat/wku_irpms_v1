import express, { Application } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './modules/users/auth/auth.routes';


import organRoutes from './modules/organization/organization.routes';
import applicantRoutes from './modules/applicants/applicant.routes';
import themeRoutes from './modules/themes/theme.routes';
import evalRoutes from './modules/evaluations/evaluation.routes';
import calendarRoutes from './modules/calendar/calendar.routes';
import callRoutes from './modules/call/call.routes';
import grantRoutes from './modules/grants/grant.routes';
import projectRoutes from './modules/project/project.routes';
import collaboratorRoutes from './modules/project/collaborators/collaborator.routes';
import assignmentRoutes from './modules/project/collaborators/assignment/assignment.routes';
import projectThemeRoutes from './modules/project/themes/protheme.routes';
import phaseRoutes from './modules/project/phase/phase.routes';
import userRoutes from './modules/users/user.routes';
import roleRoutes from './modules/users/roles/role.routes';

import { PermissionService } from './modules/users/permissions/permission.service';
import { initializeThemeModels } from './modules/themes/init.models';
import { initializeEvalModels } from './modules/evaluations/init.models';
import { initializeOrganModels } from './modules/organization/init.model';
import { UserService } from './modules/users/user.service';




dotenv.config();
const app: Application = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/roles", roleRoutes);

app.use("/api/applicants", applicantRoutes);
app.use("/api/organs", organRoutes);
app.use("/api/themes", themeRoutes);
app.use("/api/evals", evalRoutes);


app.use("/api/calendars", calendarRoutes);
app.use("/api/calls", callRoutes);
app.use("/api/grants", grantRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/collaborators", collaboratorRoutes);
app.use("/api/project/themes", projectThemeRoutes);
app.use("/api/project/phases", phaseRoutes);
app.use("/api/collaborator/assignments", assignmentRoutes);



const MONGO_URL = process.env.MONGO_URL;
const PORT = process.env.SERVER_PORT || 5000;

(async () => {
  try {
    if (!MONGO_URL) {
      throw new Error('mongo url is not set in environment variables.');
    }
    await mongoose.connect(MONGO_URL);
    console.log('database connection established');
    initializeOrganModels();
    initializeThemeModels();
    initializeEvalModels();
    await PermissionService.initPermissions();
    await UserService.initAdminUser();
   
    app.listen(PORT, () => {
      console.log(`Server API is running at http://127.0.0.1:${PORT}`);
    });
  } catch (err) {
    console.error(err);
    console.error('exiting...');
    process.exit(1);
  }
})();

