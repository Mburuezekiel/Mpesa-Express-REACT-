"use server";

import axios from "axios";

interface StkPushQueryResponse {
  data?: any;
  error?: any;
}

export async function stkPushQuery(checkoutRequestId: string): Promise<StkPushQueryResponse> {
  try {
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
    
    // Prepare the STK query request
    const stkQueryResponse = await axios.post(
      "https://sandbox.safaricom.co.ke/mpesa/stkpushquery/v1/query",
      {
        BusinessShortCode: businessShortCode,
        Password: password,
        Timestamp: timestamp,
        CheckoutRequestID: checkoutRequestId
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );
    
    return { data: stkQueryResponse.data };
  } catch (error) {
    console.error("STK Query Error:", error);
    return { error };
  }
}