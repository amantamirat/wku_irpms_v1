import express, { Application } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import userRoutes from './routes/userRoutes';
import collegeRoutes from './routes/collegeRoutes';
import directorateRoutes from './routes/directorateRoutes';
import { initAdminUser } from './services/userService';



dotenv.config();

const app: Application = express();

app.use(cors());
app.use(express.json());

app.use("/api/users", userRoutes);
app.use("/api/colleges", collegeRoutes);
app.use("/api/directorates", directorateRoutes);

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
    app.listen(PORT, () => {
      console.log(`Server API is running at http://127.0.0.1:${PORT}`);
    });
  } catch (err) {
    console.error(err);
    console.error('exiting...');
    process.exit(1);
  }
})();

