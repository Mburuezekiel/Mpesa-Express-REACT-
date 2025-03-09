
// routes/donationRoutes.js
import express from 'express';
import { saveDonationDetails } from '../controllers/donationController.js';

const router = express.Router();

// Route to handle payment success and save donation details
router.post('/payment-success', saveDonationDetails);

export default router;