// models/Donation.js
import mongoose from 'mongoose';

const donationSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true
  },
  date: {
    type: Date,
    default: Date.now
  },
  amount: {
    type: Number,
    required: true
  },
  campaign: {
    type: String,
    default: null
  },
  status: {
    type: String,
    required: true,
    enum: ['successful', 'pending', 'failed'],
    default: 'successful'
  },
  donor: {
    type: String,
    required: true
  }
});

export default mongoose.model('Donation', donationSchema);