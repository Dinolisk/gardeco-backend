import axios from "axios";
import dotenv from 'dotenv';

dotenv.config();

// ONBOARDING
const BASE_URL = process.env.API_BASE_URL || "https://card-rec-38cxuj.azurewebsites.net/CardRecognition/api";
const CASHIER_SYSTEM_ID = process.env.CASHIER_SYSTEM_ID || "5564260882";

const terminalData = {
  acquirerTerminalId: process.env.ACQUIRER_TERMINAL_ID || "1710023912",
  merchantName: process.env.MERCHANT_NAME || "Unknown",
  merchantCity: process.env.MERCHANT_CITY || "Stockholm",
  merchantCountry: process.env.MERCHANT_COUNTRY || "SWE",
  merchantIds: [
    {
      cardType: "VISA",
      acquirerMerchantId: process.env.ACQUIRER_MERCHANT_ID || "6598745",
    },
  ],
};

// SAVETERMINAL function
const saveTerminal = async (apiKey = process.env.API_KEY) => {
  const url = `${BASE_URL}/terminal/save?cashierSystemId=${CASHIER_SYSTEM_ID}`;

  try {
    const headers = {
      "Content-Type": "application/json",
    };

    if (apiKey) {
      headers["x-api-key"] = apiKey;
    }

    // Sending POST request to register terminal
    const response = await axios.post(url, terminalData, { headers });

    // Log the entire API response
    console.log("Status:", response.status);
    console.log("Response Headers:", response.headers);
    console.log("Response Data:", response.data);

    if (response.status === 200) {
      console.log("Terminal successfully registered:", response.data);
      return response.data;
    }

    throw new Error(`Unexpected status: ${response.status}`);
  } catch (error) {
    if (error.response) {
      console.error("Error registering terminal:", error.response.status);
      console.error("Server response:", error.response.data);
    } else {
      console.error("Error:", error.message);
    }
    throw error;
  }
};

// GET TERMINAL function
const getTerminal = async (cashierSystemId = CASHIER_SYSTEM_ID, apiKey = process.env.API_KEY) => {
  const url = `${BASE_URL}/terminal/terminalId/{terminalId}${cashierSystemId}`;

  try {
    const headers = {
      "Content-Type": "application/json",
    };

    if (apiKey) {
      headers["x-api-key"] = apiKey;
    }
    // Sending GET request to retrieve terminal data
    const response = await axios.get(url, { headers });

    if (response.status === 200) {
      console.log("Get terminal succeeded:", response.data);
      console.log("Status code:", response.status);
      return response.data;
    } else {
      throw new Error(`Unexpected status: ${response.status}`);
    }
  } catch (error) {
    console.error("Error retrieving terminal:", error.message);
    throw error;
  }
};

export { saveTerminal, getTerminal };
