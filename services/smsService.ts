// services/smsService.ts
import axios from 'axios';

const API_KEY = '76apyr8vo4n8xp2xiau58akx8f1gbdrh';
const BASE_URL = 'https://restapi.easysendsms.app/v1/rest/sms/send';

/**
 * Sends an SMS immediately.
 * @param to Recipient phone number or comma-separated numbers (e.g., "21612345678,21687654321")
 * @param text Message body
 */
export const sendSMS = async (to: string, text: string) => {
  try {
    // Clean numbers: remove +, 00, and spaces. Handle comma-separated list.
    const cleanNumbers = to.split(',')
      .map(num => num.trim().replace(/\s+/g, '').replace(/^\+/, '').replace(/^00/, ''))
      .join(',');

    const response = await axios.post(
      BASE_URL,
      {
        from: 'MediRemind',
        to: cleanNumbers,
        text,
        type: "0", // MUST be a string "0" for the REST API
      },
      {
        headers: {
          'apikey': API_KEY, // Use lowercase as per documentation
          'Content-Type': 'application/json',
        },
      }
    );

    // API returns status as 'success' or error code
    if (response.data && (response.data.status === 'success' || response.data.status === 1)) {
      console.log(`✅ SMS sent to ${cleanNumbers}`);
      return response.data;
    } else {
      console.error(`❌ API Error sending SMS to ${cleanNumbers}:`, response.data);
      return null;
    }
  } catch (error: any) {
    console.error(`❌ Connection Error sending SMS:`, error.response?.data || error.message);
    return null;
  }
};

/**
 * Schedules an SMS for future delivery.
 * If the date is very close (less than 60 seconds from now), sends immediately.
 * @param to Recipient phone number or comma-separated numbers
 * @param text Message body
 * @param scheduledDate Date object for delivery time
 */
export const scheduleSMS = async (to: string, text: string, scheduledDate: Date) => {
  try {
    const now = new Date();
    const diffSeconds = (scheduledDate.getTime() - now.getTime()) / 1000;

    if (diffSeconds < 60) {
      return sendSMS(to, text);
    }

    const cleanNumbers = to.split(',')
      .map(num => num.trim().replace(/\s+/g, '').replace(/^\+/, '').replace(/^00/, ''))
      .join(',');

    // Format date as ISO 8601 UTC (YYYY-MM-DDTHH:mm:ss)
    const scheduled = scheduledDate.toISOString().split('.')[0];
    
    console.log(`📡 Scheduling SMS for ${cleanNumbers} at ${scheduled} (UTC)`);

    const response = await axios.post(
      BASE_URL,
      {
        from: 'MediRemind',
        to: cleanNumbers,
        text,
        type: "0", // MUST be a string
        scheduled,
      },
      {
        headers: {
          'apikey': API_KEY,
          'Content-Type': 'application/json',
        },
      }
    );

    if (response.data && (response.data.status === 'success' || response.data.status === 1)) {
      console.log(`✅ SMS scheduled for ${cleanNumbers} at ${scheduled} (UTC)`);
      return response.data;
    } else {
      console.error(`❌ API Error for ${cleanNumbers} at ${scheduled}:`, response.data);
      return null;
    }
  } catch (error: any) {
    const errorData = error.response?.data;
    console.error(`❌ Network/API Error scheduling SMS:`, errorData || error.message);
    return null;
  }
};
