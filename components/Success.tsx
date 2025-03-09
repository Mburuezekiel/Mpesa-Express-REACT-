import React, { useEffect, useState } from 'react';
import { CheckCircle } from 'lucide-react';
import axios from 'axios';

export default function PaymentSuccess() {
  const [timeLeft, setTimeLeft] = useState(30);
  const [saveStatus, setSaveStatus] = useState('saving'); // 'saving', 'success', 'error'
  const redirectUrl = "https://www.inuafund.co.ke/account/donations";
  
  useEffect(() => {
    // Get payment details from localStorage
    const paymentDetails = {
      id: localStorage.getItem('transactionId'),
      amount: localStorage.getItem('donationAmount'),
      campaign: localStorage.getItem('campaignName') || null,
      donor: localStorage.getItem('donorName'),
      phone: localStorage.getItem('donorPhone') // Added phone number
    };
    
    // Save donation details to database
    const saveDonation = async () => {
      try {
        await axios.post('/api/donations/payment-success', paymentDetails);
        setSaveStatus('success');
        // Clear localStorage after successful save
        localStorage.removeItem('transactionId');
        localStorage.removeItem('donationAmount');
        localStorage.removeItem('campaignName');
        localStorage.removeItem('donorName');
        localStorage.removeItem('donorPhone');
      } catch (error) {
        console.error('Error saving donation:', error);
        setSaveStatus('error');
      }
    };
    
    // Only save if we have the required fields
    if (paymentDetails.id && paymentDetails.amount && paymentDetails.donor) {
      saveDonation();
    } else {
      console.error('Missing required payment details:', paymentDetails);
      setSaveStatus('error');
    }
    
    // Set up the countdown timer
    const timer = setInterval(() => {
      setTimeLeft((prevTime) => {
        if (prevTime <= 1) {
          clearInterval(timer);
          window.location.href = redirectUrl;
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);
    
    // Clean up the timer when component unmounts
    return () => clearInterval(timer);
  }, []);
  
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-green-50 to-green-100">
      <div className="max-w-md w-full mx-auto bg-white rounded-xl shadow-lg overflow-hidden p-8">
        <div className="flex flex-col items-center space-y-6">
          <div className="bg-green-100 p-3 rounded-full">
            <CheckCircle className="h-12 w-12 text-green-600" />
          </div>
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold text-gray-800">Payment Successful!</h1>
            <p className="text-gray-600">Thank you for your generous donation</p>
            
            {saveStatus === 'error' && (
              <p className="text-red-500 text-sm mt-2">
                Note: There was an issue saving your donation details. Do not worry, your payment was processed successfully.
              </p>
            )}
            
            <div className="mt-6 pt-6 border-t border-gray-100">
              <p className="text-sm text-gray-500">You will be redirected in {timeLeft} seconds</p>
              <a
                href={redirectUrl}
                className="mt-4 inline-block px-6 py-3 bg-green-600 text-white font-medium rounded-lg shadow-md hover:bg-green-700 transition-colors"
              >
                View My Donations
              </a>
            </div>
            <p className="mt-4 text-xs text-gray-400">
              Your donation receipt has been emailed to you
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}