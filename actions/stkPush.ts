"use server";

import axios from "axios";

interface StkPushResponse {
  data?: any;
  error?: any;
}

interface StkPushData {
  mpesa_number: string;
  name: string;
  amount: number;
  email?: string;
  purpose?: string;
}

export async function sendStkPush(data: StkPushData): Promise<StkPushResponse> {
  try {
    // Determine environment
    const environment = process.env.MPESA_ENVIRONMENT || "sandbox";
    const isSandbox = environment.toLowerCase() === "sandbox";

    // Format the phone number to remove any + symbols and ensure it starts with 254
    let phoneNumber = data.mpesa_number;
    if (phoneNumber.startsWith("+")) {
      phoneNumber = phoneNumber.substring(1);
    }
    if (phoneNumber.startsWith("0")) {
      phoneNumber = "254" + phoneNumber.substring(1);
    }
    
    // Get the current date and time in the required format
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const seconds = String(date.getSeconds()).padStart(2, "0");
    
    const timestamp = `${year}${month}${day}${hours}${minutes}${seconds}`;
    
    // Business ShortCode and PassKey from environment variables
    const businessShortCode = process.env.MPESA_SHORTCODE || "174379";
    const passKey = process.env.MPESA_PASSKEY || "bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919";
    
    // Generate the password
    const password = Buffer.from(businessShortCode + passKey + timestamp).toString("base64");
    
    // Set the appropriate base URL based on environment
    const baseUrl = isSandbox 
      ? "https://sandbox.safaricom.co.ke" 
      : "https://api.safaricom.co.ke";
    
    console.log(`Using M-Pesa ${environment} environment with base URL: ${baseUrl}`);
    
    // Get access token - this should be cached and reused until expiry
    const authResponse = await axios.get(
      `${baseUrl}/oauth/v1/generate?grant_type=client_credentials`,
      {
        headers: {
          Authorization: `Basic ${Buffer.from(
            `${process.env.MPESA_CONSUMER_KEY}:${process.env.MPESA_CONSUMER_SECRET}`
          ).toString("base64")}`,
        },
      }
    );
    
    if (!authResponse.data || !authResponse.data.access_token) {
      console.error("Failed to get access token:", authResponse.data);
      return { error: "Failed to authenticate with M-Pesa" };
    }
    
    const accessToken = authResponse.data.access_token;
    
    // Prepare the STK push request
    const callbackURL = process.env.MPESA_CALLBACK_URL || "https://mpesa-express-react.vercel.app/api/donations/payment-success";
   
    console.log(`Initiating STK Push for phone ${phoneNumber} with callback URL: ${callbackURL}`);
    
    const stkPushResponse = await axios.post(
      `${baseUrl}/mpesa/stkpush/v1/processrequest`,
      {
        BusinessShortCode: businessShortCode,
        Password: password,
        Timestamp: timestamp,
        TransactionType: "CustomerPayBillOnline",
        Amount: Math.round(data.amount), // Amount must be an integer
        PartyA: phoneNumber,
        PartyB: businessShortCode,
        PhoneNumber: phoneNumber,
        CallBackURL: callbackURL,
        AccountReference: data.purpose ? `${data.name}-${data.purpose}` : data.name || "Donation",
        TransactionDesc: `Donation - ${data.purpose || "General Support"}`
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );
    
    console.log("STK Push successful:", stkPushResponse.data);
    return { data: stkPushResponse.data };
  } catch (error: any) {
    console.error("STK Push Error:", error.response?.data || error.message || error);
    return { 
      error: error.response?.data || error.message || "An unexpected error occurred with the payment service" 
    };
  }
}