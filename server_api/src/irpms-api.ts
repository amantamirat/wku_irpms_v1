import express, { Application } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/user.routes';
import roleRoutes from './routes/role.routes';
import organizationRoutes from './modules/organizations/organization.routes';
import applicantRoutes from './modules/applicants/applicant.routes';
import themeRoutes from './modules/theme/theme.routes';

import collegeRoutes from './routes/collegeRoutes';
import departmentRoutes from './routes/departmentRoutes';
import programRoutes from './routes/programRoutes';
import specializationRoutes from './routes/specializationRoutes';
import directorateRoutes from './routes/directorateRoutes';
import calendarRoutes from './routes/calendarRoutes';
import positionRoutes from './routes/positionRoutes';
import rankRoutes from './routes/rankRoutes';

import callRoutes from './routes/call.routes';

import thmRoutes from './routes/theme/theme.routes';
import priorityAreaRoutes from './routes/theme/priorityArea.routes';
import subAreaRoutes from './routes/theme/subArea.routes';

import evaluationRoutes from './routes/evaluation/evaluation.routes';
import stageRoutes from './routes/evaluation/stage.routes';
import weightRoutes from './routes/evaluation/weight.routes';
import criterionOptionRoutes from './routes/evaluation/criterionOption.routes';

import { seedPositions, seedSectors } from './services/seedService';
import { initAdminUser, initPermissions, initRoles } from './services/initService';




dotenv.config();

const app: Application = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/roles", roleRoutes);
app.use("/api/organizations", organizationRoutes);
app.use("/api/themes", themeRoutes);



app.use("/api/colleges", collegeRoutes);
app.use("/api/departments", departmentRoutes);
app.use("/api/specializations", specializationRoutes);
app.use("/api/programs", programRoutes);
app.use("/api/directorates", directorateRoutes);
app.use("/api/calendars", calendarRoutes);
app.use("/api/positions", positionRoutes);
app.use("/api/ranks", rankRoutes);
app.use("/api/applicants", applicantRoutes);
app.use("/api/calls", callRoutes);

app.use("/api/thms", thmRoutes);
app.use("/api/priorityAreas", priorityAreaRoutes);
app.use("/api/subAreas", subAreaRoutes);

app.use("/api/evaluations", evaluationRoutes);
app.use("/api/stages", stageRoutes);
app.use("/api/weights", weightRoutes);
app.use("/api/criterionOptions", criterionOptionRoutes);

const MONGO_URL = process.env.MONGO_URL;
const PORT = process.env.SERVER_PORT || 5000;

(async () => {
  try {
    if (!MONGO_URL) {
      throw new Error('mongo url is not set in environment variables.');
    }
    await mongoose.connect(MONGO_URL);
    console.log('database connection established');    
    await initPermissions();
    await initRoles();
    await initAdminUser();
    
    await seedPositions();
    await seedSectors();
    app.listen(PORT, () => {
      console.log(`Server API is running at http://127.0.0.1:${PORT}`);
    });
  } catch (err) {
    console.error(err);
    console.error('exiting...');
    process.exit(1);
  }
})();

