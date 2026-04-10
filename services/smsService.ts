// services/smsService.ts
import axios from "axios";

const API_KEY = "ky671zbahoaim3ondm4ioc7qtkt6onr7";
const BASE_URL = "https://restapi.easysendsms.app/v1/rest/sms/send";

// Simple in-memory cache to prevent duplicate scheduling in the same session
const scheduledCache = new Set<string>();

/**
 * Sends an SMS immediately.
 * @param to Recipient phone number or comma-separated numbers (e.g., "21612345678,21687654321")
 * @param text Message body
 */
export const sendSMS = async (to: string, text: string) => {
  try {
    // Clean numbers: remove +, 00, spaces, and ensure 13 digits for EasySendSMS (e.g., 216XXXXXXXX)
    const cleanNumbers = to
      .split(",")
      .map((num) => {
        let cleaned = num
          .trim()
          .replace(/\s+/g, "")
          .replace(/^\+/, "")
          .replace(/^00/, "");
        // If the number is 8 digits (Tunisian format), prepend 216
        if (cleaned.length === 8 && /^\d+$/.test(cleaned)) {
          cleaned = "216" + cleaned;
        }
        return cleaned;
      })
      .filter((num) => num.length >= 8) // Keep only valid-length numbers
      .join(",");

    if (!cleanNumbers) {
      console.error(`❌ No valid phone numbers provided: ${to}`);
      return null;
    }

    const response = await axios.post(
      BASE_URL,
      {
        from: "EasySend",
        to: cleanNumbers,
        text,
        type: "0", // MUST be a string "0" for the REST API
      },
      {
        headers: {
          apikey: API_KEY, // Use lowercase as per documentation
          "Content-Type": "application/json",
        },
      },
    );

    // API returns status as 'success' or error code
    if (
      response.data &&
      (response.data.status === "success" ||
        response.data.status === 1 ||
        response.data.status === "OK")
    ) {
      console.log(`✅ SMS sent to ${cleanNumbers}`);
      return response.data;
    } else {
      console.error(
        `❌ API Error sending SMS to ${cleanNumbers}:`,
        response.data,
      );
      return null;
    }
  } catch (error: any) {
    console.error(
      `❌ Connection Error sending SMS:`,
      error.response?.data || error.message,
    );
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
export const scheduleSMS = async (
  to: string,
  text: string,
  scheduledDate: Date,
) => {
  try {
    const now = new Date();
    const diffSeconds = (scheduledDate.getTime() - now.getTime()) / 1000;

    if (diffSeconds < 60) {
      return sendSMS(to, text);
    }

    const cleanNumbers = to
      .split(",")
      .map((num) => {
        let cleaned = num
          .trim()
          .replace(/\s+/g, "")
          .replace(/^\+/, "")
          .replace(/^00/, "");
        // If the number is 8 digits (Tunisian format), prepend 216
        if (cleaned.length === 8 && /^\d+$/.test(cleaned)) {
          cleaned = "216" + cleaned;
        }
        return cleaned;
      })
      .filter((num) => num.length >= 8) // Keep only valid-length numbers
      .join(",");

    if (!cleanNumbers) {
      console.error(`❌ No valid phone numbers provided: ${to}`);
      return null;
    }

    // Format date as ISO 8601 UTC (YYYY-MM-DDTHH:mm:ss)
    const scheduled = scheduledDate.toISOString().split(".")[0];

    // Deduplication key: phoneNumbers + scheduledTime + simple text hash (or just name/dose)
    const dedupKey = `${cleanNumbers}-${scheduled}`;
    if (scheduledCache.has(dedupKey)) {
      console.log(
        `⏭️ SMS already scheduled for ${cleanNumbers} at ${scheduled} (cached)`,
      );
      return { status: "OK", cached: true };
    }

    console.log(`📡 Scheduling SMS for ${cleanNumbers} at ${scheduled} (UTC)`);

    const response = await axios.post(
      BASE_URL,
      {
        from: "EasySend",
        to: cleanNumbers,
        text,
        type: "0", // MUST be a string
        scheduled,
      },
      {
        headers: {
          apikey: API_KEY,
          "Content-Type": "application/json",
        },
      },
    );

    if (
      response.data &&
      (response.data.status === "success" ||
        response.data.status === 1 ||
        response.data.status === "OK")
    ) {
      scheduledCache.add(dedupKey);
      console.log(`✅ SMS scheduled for ${cleanNumbers} at ${scheduled} (UTC)`);
      return response.data;
    } else {
      console.error(
        `❌ API Error for ${cleanNumbers} at ${scheduled}:`,
        response.data,
      );
      return null;
    }
  } catch (error: any) {
    const errorData = error.response?.data;
    console.error(
      `❌ Network/API Error scheduling SMS:`,
      errorData || error.message,
    );
    return null;
  }
};
