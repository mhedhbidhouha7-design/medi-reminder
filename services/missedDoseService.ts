// services/missedDoseService.ts
import { get, ref, update } from "firebase/database";
import { getProches } from "../controllers/procheController";
import { db } from "../firebaseConfig";
import { sendEmail } from "./emailService";
import { getNotificationContent } from "./notificationMessages";

/**
 * Helper to parse "HH:mm" time strings
 */
const parseTime = (timeStr: string) => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return { hours: hours || 0, minutes: minutes || 0 };
};

/**
 * Checks for medication doses that were missed and notifies proches via email.
 * FOR TESTING: Set to 1 minute instead of 2 days.
 */
export const checkAndNotifyMissedDoses = async (userId: string) => {
  try {
    console.log("🧐 Checking for missed doses (TEST MODE: 1 minute delay)...");

    const medRef = ref(db, `users/${userId}/medications`);
    const snapshot = await get(medRef);
    if (!snapshot.exists()) return;

    const medications = snapshot.val();
    const proches = await getProches(userId);
    const procheContacts = proches.filter(p => !!p.email);

    if (procheContacts.length === 0) return;

    const now = new Date();
    // TEST: Change from 2 days to 1 minute
    const escalationThreshold = new Date(now.getTime() - 1 * 60 * 1000);

    for (const medId in medications) {
      const med = medications[medId];
      const schedules = med.schedules || [];
      const takenLogs = med.takenLogs || {};
      const notifiedLogs = med.notifiedLogs || {};

      const startDate = new Date(med.startDate);
      const endDate = new Date(med.endDate);
      endDate.setHours(23, 59, 59);

      let currentCheckDate = new Date(startDate);
      // Don't check beyond today
      const todayEnd = new Date(now);
      todayEnd.setHours(23, 59, 59);

      while (currentCheckDate <= todayEnd && currentCheckDate <= endDate) {
        const dateKey = currentCheckDate.toISOString().split('T')[0];

        for (let i = 0; i < schedules.length; i++) {
          const schedule = schedules[i];
          const { hours, minutes } = parseTime(schedule.time);

          // Create the full date/time for this specific dose
          const doseDateTime = new Date(currentCheckDate);
          doseDateTime.setHours(hours, minutes, 0, 0);

          // Only check doses that are supposed to have happened already (minus the threshold)
          if (doseDateTime > escalationThreshold) continue;

          const doseStatus = takenLogs[dateKey]?.[i]?.status;
          const alreadyNotified = notifiedLogs[dateKey]?.[i];

          if (doseStatus !== "taken" && !alreadyNotified) {
            console.log(`⚠️ TEST ALERT: Missed ${med.name} at ${schedule.time} on ${dateKey}`);

            const msg = getNotificationContent("medication_dose", {
              medicationName: med.name,
              dose: schedule.dose
            });

            const escalationMessage = ` ${msg.email} (Prévu à ${schedule.time})`;

            for (const proche of procheContacts) {
              await sendEmail(proche.email, proche.name, escalationMessage);
            }

            // Mark as notified
            const notifyRef = ref(db, `users/${userId}/medications/${medId}/notifiedLogs/${dateKey}`);
            await update(notifyRef, { [i]: true });
          }
        }
        currentCheckDate.setDate(currentCheckDate.getDate() + 1);
      }
    }
  } catch (error) {
    console.error("Error checking missed doses:", error);
  }
};
