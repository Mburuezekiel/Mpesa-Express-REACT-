
import dotenv from 'dotenv';

dotenv.config();

import express from 'express';
import mongoose from 'mongoose';


import path from 'path';
import { fileURLToPath } from 'url';
import donationRoutes from './routes/donationRoutes.js';



const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// At the top of your server.js file
app.use((req, _res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
  });

// Middleware
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/donations', donationRoutes);

// For integrating with your React frontend
app.get('/payment-success', (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'payment-success.html'));
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));