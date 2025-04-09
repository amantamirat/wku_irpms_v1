const mongoose = require('mongoose');
const express = require('express');
const cors = require('cors');
const app = express();
app.use(cors());
app.use(express.json());
require('dotenv').config();

mongoose.connect(process.env.MONGO_URL)
  .then(async () => {
    console.log('databased connection established');    
  })
  .catch(err => {
    console.error('database connection error:', err);
  });

app.listen(process.env.SERVER_PORT, () => {
    console.log(`Server api is running at http://127.0.0.1:${process.env.SERVER_PORT}`);
});