// services/emailService.ts
import axios from "axios";

/**
 * Configuration for EmailJS
 * You can get these from your EmailJS dashboard: https://dashboard.emailjs.com/
 */
const EMAILJS_SERVICE_ID = "service_7f4bdhl";
const EMAILJS_TEMPLATE_ID = "template_xfc8nsc";
const EMAILJS_PUBLIC_KEY = "rVDLIxyAXtMWQj5qj";

/**
 * Sends an email using EmailJS REST API.
 * @param toEmail Recipient email address
 * @param toName Recipient name
 * @param message The message content
 * @param patientName The name of the patient (the app user)
 */
export const sendEmail = async (
  toEmail: string,
  toName: string,
  message: string,
  patientName: string = "Votre proche",
) => {
  try {
    const data = {
      service_id: EMAILJS_SERVICE_ID,
      template_id: EMAILJS_TEMPLATE_ID,
      user_id: EMAILJS_PUBLIC_KEY,
      template_params: {
        to_email: toEmail,
        to_name: toName,
        message: message,
        from_name: "MediReminder",
        patient_name: patientName,
      },
    };

    const response = await axios.post(
      "https://api.emailjs.com/api/v1.0/email/send",
      data,
      {
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    if (response.status === 200) {
      console.log(`✅ Email sent to ${toEmail}`);
      return true;
    } else {
      console.error(`❌ EmailJS Error:`, response.data);
      return false;
    }
  } catch (error: any) {
    console.error(
      `❌ Connection Error sending Email:`,
      error.response?.data || error.message,
    );
    return false;
  }
};

/**
 * Placeholder for scheduling emails.
 * EmailJS doesn't support future scheduling natively on the REST API for free.
 * For now, this will simply log the intent, or you can integrate with a 
 * backend/cloud function if scheduling is required.
 */
export const scheduleEmail = async (
  toEmail: string,
  toName: string,
  message: string,
  scheduledDate: Date,
  patientName: string = "Votre proche",
) => {
  const now = new Date();
  const diffSeconds = (scheduledDate.getTime() - now.getTime()) / 1000;

  // If it's time to send (or very close), send it now
  if (diffSeconds < 60) {
    return sendEmail(toEmail, toName, message, patientName);
  }

  // NOTE: For true scheduling in the future (hours/days), 
  // you would typically save this request to Firebase and have a 
  // Cloud Function trigger it at the correct time.
  console.log(`📧 [Scheduled] Email for ${toEmail} at ${scheduledDate.toISOString()}`);
  return { status: "Scheduled", info: "Email scheduled locally" };
};
