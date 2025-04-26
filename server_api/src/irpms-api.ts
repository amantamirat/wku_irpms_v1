import express, { Application } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import collegeRoutes from './routes/collegeRoutes';

dotenv.config();

const app: Application = express();

app.use(cors());
app.use(express.json());

app.use("/api/colleges", collegeRoutes);

const MONGO_URL = process.env.MONGO_URL || '';
const PORT = process.env.SERVER_PORT || 5000;

mongoose.connect(MONGO_URL)
  .then(() => {
    console.log('database connection established');
  })
  .catch(err => {
    console.error('database connection error:', err);
  });

app.listen(PORT, () => {
  console.log(`Server API is running at http://127.0.0.1:${PORT}`);
});
