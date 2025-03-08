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
}

export async function sendStkPush(data: StkPushData): Promise<StkPushResponse> {
  try {
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
    
    // Business ShortCode and PassKey should come from environment variables
    // For sandbox testing, these are the default values
    const businessShortCode = process.env.MPESA_SHORTCODE || "174379";
    const passKey = process.env.MPESA_PASSKEY || "bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919";
    
    // Generate the password
    const password = Buffer.from(businessShortCode + passKey + timestamp).toString("base64");
    
    // Get access token - this should be cached and reused until expiry
    const authResponse = await axios.get(
      "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials",
      {
        headers: {
          Authorization: `Basic ${Buffer.from(
            `${process.env.MPESA_CONSUMER_KEY}:${process.env.MPESA_CONSUMER_SECRET}`
          ).toString("base64")}`,
        },
      }
    );
    
    const accessToken = authResponse.data.access_token;
    
    // Prepare the STK push request
    const stkPushResponse = await axios.post(
      "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest",
      {
        BusinessShortCode: businessShortCode,
        Password: password,
        Timestamp: timestamp,
        TransactionType: "CustomerPayBillOnline",
        Amount: Math.round(data.amount), // Amount must be an integer
        PartyA: phoneNumber,
        PartyB: businessShortCode,
        PhoneNumber: phoneNumber,
        CallBackURL: process.env.MPESA_CALLBACK_URL || "https://www.inuafund.co.ke/account/donations",
        AccountReference: data.name || "Donation",
        TransactionDesc: "Payment"
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );
    
    return { data: stkPushResponse.data };
  } catch (error) {
    console.error("STK Push Error:", error);
    return { error };
  }
}