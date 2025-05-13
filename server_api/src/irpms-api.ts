import express, { Application } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import collegeRoutes from './routes/collegeRoutes';
import departmentRoutes from './routes/departmentRoutes';
import programRoutes from './routes/programRoutes';
import specializationRoutes from './routes/specializationRoutes';
import directorateRoutes from './routes/directorateRoutes';
import calendarRoutes from './routes/calendarRoutes';
import positionRoutes from './routes/positionRoutes';
import rankRoutes from './routes/rankRoutes';
import { initAdminUser } from './services/userService';
import { seedPositionRankData, seedSectorData } from './services/seedService';



dotenv.config();

const app: Application = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/colleges", collegeRoutes);
app.use("/api/departments", departmentRoutes);
app.use("/api/specializations", specializationRoutes);
app.use("/api/programs", programRoutes);
app.use("/api/directorates", directorateRoutes);
app.use("/api/calendars", calendarRoutes);
app.use("/api/positions", positionRoutes);
app.use("/api/ranks", rankRoutes);

const MONGO_URL = process.env.MONGO_URL;
const PORT = process.env.SERVER_PORT || 5000;

(async () => {
  try {
    if (!MONGO_URL) {
      throw new Error('mongo url is not set in environment variables.');
    }
    await mongoose.connect(MONGO_URL);
    console.log('database connection established');
    await initAdminUser();
    await seedPositionRankData();
    await seedSectorData();
    app.listen(PORT, () => {
      console.log(`Server API is running at http://127.0.0.1:${PORT}`);
    });
  } catch (err) {
    console.error(err);
    console.error('exiting...');
    process.exit(1);
  }
})();

