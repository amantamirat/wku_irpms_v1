import express, { Application } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
//import authRoutes from './modules/users/auth/auth.routes';

import organizationRoutes from './modules/organization/organization.routes';
import applicantRoutes from './modules/applicants/applicant.routes';
import positionRoutes from './modules/applicants/positions/position.routes';
import experienceRoutes from './modules/applicants/experiences/experience.routes';
import specializationRoutes from './modules/applicants/specializations/specialization.routes';
import thematicRoutes from './modules/thematics/thematic.routes';
import themeRoutes2 from './modules/thematics/themes/theme.routes'
import themeRoutes from './modules/themes/theme.routes';

import evaluationRoutes from './modules/evaluations/evaluation.routes';
import criterionRoutes from './modules/evaluations/criteria/criterion.routes';
import optionRoutes from './modules/evaluations/criteria/options/option.routes';
import calendarRoutes from './modules/calendar/calendar.routes';
import cycleRoutes from './modules/cycles/cycle.routes';
import cycleStageRoutes from './modules/cycles/stages/stage.routes';
import grantRoutes from './modules/grants/grant.routes';
import constraintRoutes from './modules/grants/constraints/constraint.routes';
import compositionRoutes from './modules/grants/constraints/applicant/compositions/composition.routes';
import projectRoutes from './modules/projects/project.routes';
import collaboratorRoutes from './modules/projects/collaborators/collaborator.routes';
import assignmentRoutes from './modules/projects/collaborators/assignment/assignment.routes';
import projectThemeRoutes from './modules/projects/themes/project.theme.routes';
import phaseRoutes from './modules/projects/phase/phase.routes';
import stageRoutes2 from './modules/cycles/stages/projects/project-stage.routes';
import reviewerRoutes from './modules/cycles/stages/projects/reviewers/reviewer.routes';
import resultRoutes from './modules/cycles/stages/projects/reviewers/results/result.routes';

import userRoutes from './modules/users/user.routes';
import roleRoutes from './modules/users/roles/role.routes';
import permissionRoutes from './modules/users/permissions/permission.routes';
import path from 'path';

import { PermissionService } from './modules/users/permissions/permission.service';



dotenv.config();
const app: Application = express();

app.use(cors());
app.use(express.json());

//app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/roles", roleRoutes);
app.use("/api/permissions", permissionRoutes);

app.use("/api/applicants", applicantRoutes);
app.use("/api/organizations", organizationRoutes);
app.use("/api/specializations", specializationRoutes);
app.use("/api/positions", positionRoutes);

app.use("/api/experiences", experienceRoutes);
app.use("/api/thematics", thematicRoutes);
app.use("/api/thematics/themes", themeRoutes2);
app.use("/api/themes", themeRoutes);
//app.use("/api/evals", evalRoutes);
app.use("/api/evaluations", evaluationRoutes);
app.use("/api/criteria", criterionRoutes);
app.use("/api/options", optionRoutes);

app.use("/api/calendars", calendarRoutes);
app.use("/api/cycles", cycleRoutes);
app.use("/api/cycle/stages", cycleStageRoutes);
app.use("/api/grants", grantRoutes);
app.use("/api/grants/constraints", constraintRoutes);
app.use("/api/grants/compositions", compositionRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/project/collaborators", collaboratorRoutes);
app.use("/api/project/themes", projectThemeRoutes);
app.use("/api/project/phases", phaseRoutes);
app.use("/api/project/stages", stageRoutes2);
app.use("/api/project/reviewers", reviewerRoutes);
app.use("/api/project/results", resultRoutes);
app.use("/api/collaborator/assignments", assignmentRoutes);
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
    //await PermissionService.seedPermissions();
    // await RoleService.initAdminRole();
    // await UserService.initAdminUser();

    app.listen(PORT, () => {
      console.log(`Server API is running at http://127.0.0.1:${PORT}`);
    });
  } catch (err) {
    console.error(err);
    console.error('exiting...');
    process.exit(1);
  }
})();

