// controllers/donationController.js
import Donation from '../models/Donation.js';

// Function to save donation details to MongoDB
// export const saveDonationDetails = async (req, res) => {
//   try {
//     const { id, amount, campaign, donor } = req.body;
//     // Validate required fields
//     if (!id || !amount || !donor) {
//       return res.status(400).json({
//         success: false,
//         message: 'Missing required fields: id, amount, or donor name'
//       });
//     }
//     // Create new donation record
//     const donation = new Donation({
//       id,                   // Transaction ID
//       date: new Date(),     // Current date and time
//       amount,               // Donation amount
//       campaign: campaign || null, // Campaign or null if empty
//       status: 'successful', // Status set to successful
//       donor                 // Donor name
//     });
//     // Save to database
//     await donation.save();
//     // Return success response
//     return res.status(201).json({
//       success: true,
//       message: 'Donation recorded successfully',
//       data: donation
//     });
//   } catch (error) {
//     console.error('Error saving donation:', error);
    
//     // Handle duplicate transaction ID error
//     if (error.code === 11000) {
//       return res.status(400).json({
//         success: false,
//         message: 'Donation with this transaction ID already exists'
//       });
//     }
//     return res.status(500).json({
//       success: false,
//       message: 'Failed to record donation',
//       error: error.message
//     });
//   }
// };
export const saveDonationDetails = async (req, res) => {
    try {
      console.log('Received M-Pesa callback data:', req.body);
      
      // Extract data from M-Pesa callback
      const { 
        Body: { 
          stkCallback: { 
            MerchantRequestID, 
            CheckoutRequestID,
            ResultCode,
            ResultDesc,
            CallbackMetadata
          } 
        } 
      } = req.body;
      
      // Check if payment was successful
      if (ResultCode !== 0) {
        console.log('Payment failed:', ResultDesc);
        return res.status(400).json({
          success: false,
          message: `Payment failed: ${ResultDesc}`
        });
      }
      
      // Extract payment details from CallbackMetadata
      const amount = CallbackMetadata?.Item?.find(item => item.Name === 'Amount')?.Value;
      const mpesaReceiptNumber = CallbackMetadata?.Item?.find(item => item.Name === 'MpesaReceiptNumber')?.Value;
      const phoneNumber = CallbackMetadata?.Item?.find(item => item.Name === 'PhoneNumber')?.Value;
      
      // Create donation record
      const donation = new Donation({
        id: mpesaReceiptNumber || CheckoutRequestID, // Use M-Pesa receipt number as ID
        date: new Date(),
        amount: amount,
        status: 'successful',
        donor: phoneNumber ? `+${phoneNumber}` : 'Anonymous' // Use phone number as donor name
      });
      
      // Save to database
      await donation.save();
      
      // Return success response
      return res.status(200).json({
        success: true,
        message: 'Donation recorded successfully'
      });
    } catch (error) {
      console.error('Error saving donation:', error);
      
      // Handle duplicate transaction ID error
      if (error.code === 11000) {
        return res.status(400).json({
          success: false,
          message: 'Donation with this transaction ID already exists'
        });
      }
      
      return res.status(500).json({
        success: false,
        message: 'Failed to record donation',
        error: error.message
      });
    }
  };