import express, { Application } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/user.routes';
import roleRoutes from './routes/role.routes';
import organizationRoutes from './modules/organizations/organization.routes';
import applicantRoutes from './modules/applicants/applicant.routes';
import themeRoutes from './modules/themes/theme.routes';
import evalRoutes from './modules/evals/evaluation.routes';

import elRoutes from './modules/evaluation/evaluation.routes';
import calendarRoutes from './modules/calendar/calendar.routes';
import callRoutes from './modules/call/call.routes';



import { initAdminUser, initPermissions, initRoles } from './services/initService';
import { initializeThemeModels } from './modules/themes/init.models';
import { initializeEvalModels } from './modules/evals/init.models';


dotenv.config();
const app: Application = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/roles", roleRoutes);

app.use("/api/applicants", applicantRoutes);
app.use("/api/organizations", organizationRoutes);
app.use("/api/themes", themeRoutes);
app.use("/api/evals", evalRoutes);

app.use("/api/eval", elRoutes);
app.use("/api/calendars", calendarRoutes);
app.use("/api/calls", callRoutes);











const MONGO_URL = process.env.MONGO_URL;
const PORT = process.env.SERVER_PORT || 5000;

(async () => {
  try {
    if (!MONGO_URL) {
      throw new Error('mongo url is not set in environment variables.');
    }
    await mongoose.connect(MONGO_URL);
    console.log('database connection established');
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

