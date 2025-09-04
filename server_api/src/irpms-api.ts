import express, { Application } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes';

import roleRoutes from './routes/role.routes';
import organRoutes from './modules/organs/organization.routes';
import applicantRoutes from './modules/applicants/applicant.routes';
import themeRoutes from './modules/themes/theme.routes';
import evalRoutes from './modules/evals/evaluation.routes';
import calendarRoutes from './modules/calendar/calendar.routes';
import callRoutes from './modules/call/call.routes';
import grantRoutes from './modules/grants/grant.routes';
import projectRoutes from './modules/project/project.routes';
import userRoutes from './modules/users/user.routes';


import { initAdminUser, initPermissions, initRoles } from './services/initService';
import { initializeThemeModels } from './modules/themes/init.models';
import { initializeEvalModels } from './modules/evals/init.models';
import { initializeOrganModels } from './modules/organs/init.model';




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

    await initPermissions();
    await initRoles();
    await initAdminUser();
    app.listen(PORT, () => {
      console.log(`Server API is running at http://127.0.0.1:${PORT}`);
    });
  } catch (err) {
    console.error(err);
    console.error('exiting...');
    process.exit(1);
  }
})();

