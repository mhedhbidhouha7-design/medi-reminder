import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { getProches } from "../controllers/procheController";
import { Appointment, Medication } from "../models/interfaces";
import { scheduleSMS } from "./smsService";

// Configure how notifications should be handled when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export const requestNotificationPermissions = async () => {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== "granted") {
    console.log("Failed to get push token for push notification!");
    return false;
  }

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF231F7C",
    });
  }

  return true;
};

/**
 * Helper to parse time string into hours and minutes.
 * Handles "HH:MM" and falls back to defaults for "Morning", "Night", etc.
 */
const parseTime = (timeStr: string): { hours: number; minutes: number } => {
  const parts = timeStr.split(":");
  if (parts.length === 2) {
    const hours = parseInt(parts[0], 10);
    const minutes = parseInt(parts[1], 10);
    if (!isNaN(hours) && !isNaN(minutes)) {
      return { hours, minutes };
    }
  }

  // Fallbacks for named times
  const lower = timeStr.toLowerCase();
  if (lower.includes("morning")) return { hours: 8, minutes: 0 };
  if (lower.includes("noon") || lower.includes("midday"))
    return { hours: 12, minutes: 0 };
  if (lower.includes("afternoon")) return { hours: 14, minutes: 0 };
  if (lower.includes("evening")) return { hours: 19, minutes: 0 };
  if (lower.includes("night")) return { hours: 22, minutes: 0 };

  return { hours: 9, minutes: 0 }; // Default
};

/**
 * Schedules reminders for a medication.
 * - 30 minutes before each dose.
 * - 15 minutes before each dose.
 * - 15 minutes before each dose.
 * - At dose time (with sound - Sonnerie).
 */
export const scheduleMedicationReminders = async (
  userId: string,
  medication: Medication,
) => {
  const { schedules, startDate, endDate, name } = medication;

  // Fetch proches for this user
  const proches = await getProches(userId);

  // Use date parts to avoid UTC shift issues
  const [sYear, sMonth, sDay] = startDate.split("-").map(Number);
  const [eYear, eMonth, eDay] = endDate.split("-").map(Number);

  const start = new Date(sYear, sMonth - 1, sDay);
  const end = new Date(eYear, eMonth - 1, eDay);
  end.setHours(23, 59, 59, 999); // Ensure end date includes the whole last day

  const today = new Date();
  const todayMidnight = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );

  // Schedule for the next 7 days or until endDate
  const maxDays = 7;
  const scheduleUntil = new Date(todayMidnight);
  scheduleUntil.setDate(todayMidnight.getDate() + maxDays);
  scheduleUntil.setHours(23, 59, 59, 999);

  const finalEndDate = end < scheduleUntil ? end : scheduleUntil;

  // Loop through days from start (or today) until finalEndDate
  const d = new Date(start > todayMidnight ? start : todayMidnight);

  while (d <= finalEndDate) {
    for (const schedule of schedules) {
      const { hours, minutes } = parseTime(schedule.time);
      const doseTime = new Date(d);
      doseTime.setHours(hours, minutes, 0, 0);

      // Skip times that have already passed today
      if (doseTime <= today) continue;

      // 1. Reminder 30 minutes before
      const reminder30 = new Date(doseTime.getTime() - 30 * 60 * 1000);
      if (reminder30 > today) {
        const content: any = {
          title: "⏰ Rappel de médicament",
          body: `Vous devez prendre ${name} (${schedule.dose}) dans 30 minutes.`,
          data: {
            medId: medication.id,
            type: "medication_reminder_30",
            medicationName: name,
            dose: schedule.dose,
            isFullScreen: false,
          },
        };
        if (Platform.OS === "android") content.channelId = "default";

        await Notifications.scheduleNotificationAsync({
          content,
          trigger: { type: "date", date: reminder30 } as any,
        });

        // SMS 30 min before (Batched)
        const phoneNumbers = proches
          .map((p) => p.phone)
          .filter(Boolean)
          .join(",");
        if (phoneNumbers) {
          const smsText = `⏰ Rappel Proche : Votre proche doit prendre ${name} (${schedule.dose}) dans 30 minutes.`;
          await scheduleSMS(phoneNumbers, smsText, reminder30);
        }
      }

      // 2. Reminder 15 minutes before
      const reminder15 = new Date(doseTime.getTime() - 15 * 60 * 1000);
      if (reminder15 > today) {
        const content: any = {
          title: "⚠️ Rappel de médicament",
          body: `Vous devez prendre ${name} (${schedule.dose}) dans 15 minutes.`,
          data: {
            medId: medication.id,
            type: "medication_reminder_15",
            medicationName: name,
            dose: schedule.dose,
            isFullScreen: false,
          },
        };
        if (Platform.OS === "android") content.channelId = "default";

        await Notifications.scheduleNotificationAsync({
          content,
          trigger: { type: "date", date: reminder15 } as any,
        });

        // SMS 15 min before (Batched)
        const phoneNumbers15 = proches
          .map((p) => p.phone)
          .filter(Boolean)
          .join(",");
        if (phoneNumbers15) {
          const smsText = `⚠️ Rappel Proche : Votre proche doit prendre ${name} (${schedule.dose}) dans 15 minutes.`;
          await scheduleSMS(phoneNumbers15, smsText, reminder15);
        }
      }

      // 3. Exact time notification (Sonnerie) - FULL SCREEN
      const doseContent: any = {
        title: "💊 Heure du médicament !",
        body: `C'est l'heure de prendre votre ${name} (${schedule.dose}).`,
        data: {
          medId: medication.id,
          type: "medication_dose",
          medicationName: name,
          dose: schedule.dose,
          scheduledTime: doseTime.toLocaleTimeString("fr-FR", {
            hour: "2-digit",
            minute: "2-digit",
          }),
          isFullScreen: true,
        },
        sound: true,
      };
      if (Platform.OS === "android") doseContent.channelId = "default";

      await Notifications.scheduleNotificationAsync({
        content: doseContent,
        trigger: { type: "date", date: doseTime } as any,
      });

      // Schedule SMS for proches at dose time (Batched)
      const phoneNumbersDose = proches
        .map((p) => p.phone)
        .filter(Boolean)
        .join(",");
      if (phoneNumbersDose) {
        const smsText = `🚨 Rappel Proche : Il est l'heure pour votre proche de prendre son médicament : ${name} (${schedule.dose}).`;
        await scheduleSMS(phoneNumbersDose, smsText, doseTime);
      }
    }
    d.setDate(d.getDate() + 1);
  }
};

/**
 * Quick test: fires 3 notifications at 5s, 10s, and 15s from now.
 * Use this to verify notifications work in Expo Go.
 * Call from any screen: import { testNotifications } from '../services/notificationService';
 */
export const testNotifications = async () => {
  const now = Date.now();

  // Test 1: fires in 5 seconds (simulates "30 min before")
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "⏰ TEST - 30 min avant",
      body: "Vous devez prendre Doliprane (500mg) dans 30 minutes.",
      data: { type: "test_30" },
      sound: false,
    },
    trigger: { type: "date", date: new Date(now + 5 * 1000) } as any,
  });

  // Test 2: fires in 10 seconds (simulates "15 min before")
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "⚠️ TEST - 15 min avant",
      body: "Vous devez prendre Doliprane (500mg) dans 15 minutes.",
      data: { type: "test_15" },
      sound: false,
    },
    trigger: { type: "date", date: new Date(now + 10 * 1000) } as any,
  });

  // Test 3: fires in 15 seconds (simulates "dose time" with sound)
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "💊 TEST - Heure du médicament !",
      body: "C'est l'heure de prendre votre Doliprane (500mg).",
      data: { type: "test_dose" },
      sound: true,
    },
    trigger: { type: "date", date: new Date(now + 15 * 1000) } as any,
  });

  console.log("✅ 3 test notifications scheduled: 5s, 10s, 15s from now");
};

/**
 * Schedules reminders for an appointment (assignment).
 * - 2 days before.
 * - 1 day before.
 * - 5 hours before.
 * - 5 hours before.
 * - At appointment time (with sound).
 */
export const scheduleAppointmentReminders = async (
  userId: string,
  appointment: Appointment,
) => {
  const { date, time, title, id } = appointment;

  // Fetch proches
  const proches = await getProches(userId);

  const [year, month, day] = date.split("-").map(Number);
  const { hours, minutes } = parseTime(time);

  const apptTime = new Date(year, month - 1, day, hours, minutes, 0, 0);
  const today = new Date();

  if (apptTime <= today) return;

  // 1. Two days before
  const twoDaysBefore = new Date(apptTime.getTime() - 2 * 24 * 60 * 60 * 1000);
  if (twoDaysBefore > today) {
    const content: any = {
      title: "📅 Devoir/RDV dans 2 jours",
      body: `Rappel : ${title} est dans 2 jours (le ${date} à ${time}).`,
      data: { apptId: id, type: "appointment_2d" },
    };
    if (Platform.OS === "android") content.channelId = "default";

    await Notifications.scheduleNotificationAsync({
      content,
      trigger: { type: "date", date: twoDaysBefore } as any,
    });

    // SMS 2 days before (Batched)
    const phoneNumbers2d = proches
      .map((p) => p.phone)
      .filter(Boolean)
      .join(",");
    if (phoneNumbers2d) {
      const smsText = `📅 Rappel RDV Proche : Votre proche a un rendez-vous (${title}) dans 2 jours (le ${date} à ${time}).`;
      await scheduleSMS(phoneNumbers2d, smsText, twoDaysBefore);
    }
  }

  // 2. One day before
  const oneDayBefore = new Date(apptTime.getTime() - 24 * 60 * 60 * 1000);
  if (oneDayBefore > today) {
    const content: any = {
      title: "⚠️ Devoir/RDV demain",
      body: `Rappel : ${title} est demain à ${time}.`,
      data: { apptId: id, type: "appointment_1d" },
    };
    if (Platform.OS === "android") content.channelId = "default";

    await Notifications.scheduleNotificationAsync({
      content,
      trigger: { type: "date", date: oneDayBefore } as any,
    });

    // SMS 1 day before (Batched)
    const phoneNumbers1d = proches
      .map((p) => p.phone)
      .filter(Boolean)
      .join(",");
    if (phoneNumbers1d) {
      const smsText = `⚠️ Rappel RDV Proche : Votre proche a un rendez-vous (${title}) demain à ${time}.`;
      await scheduleSMS(phoneNumbers1d, smsText, oneDayBefore);
    }
  }

  // 3. Five hours before
  const fiveHoursBefore = new Date(apptTime.getTime() - 5 * 60 * 60 * 1000);
  if (fiveHoursBefore > today) {
    const content: any = {
      title: "⏰ Devoir/RDV aujourd'hui",
      body: `Votre assignment ${title} est dans 5 heures.`,
      data: { apptId: id, type: "appointment_5h" },
    };
    if (Platform.OS === "android") content.channelId = "default";

    await Notifications.scheduleNotificationAsync({
      content,
      trigger: { type: "date", date: fiveHoursBefore } as any,
    });

    // SMS 5 hours before (Batched)
    const phoneNumbers5h = proches
      .map((p) => p.phone)
      .filter(Boolean)
      .join(",");
    if (phoneNumbers5h) {
      const smsText = `⏰ Rappel RDV Proche : Votre proche a un rendez-vous (${title}) dans quelques heures (à ${time}).`;
      await scheduleSMS(phoneNumbers5h, smsText, fiveHoursBefore);
    }
  }

  // 4. Exact time (Sonne)
  const contentNow: any = {
    title: "🚀 C'est l'heure !",
    body: `Il est temps pour votre RDV chez le : ${title}.`,
    data: { apptId: id, type: "appointment_now" },
    sound: true,
  };
  if (Platform.OS === "android") contentNow.channelId = "default";

  await Notifications.scheduleNotificationAsync({
    content: contentNow,
    trigger: { type: "date", date: apptTime } as any,
  });

  // Schedule SMS for proches at appointment time (Batched)
  const phoneNumbersAppt = proches
    .map((p) => p.phone)
    .filter(Boolean)
    .join(",");
  if (phoneNumbersAppt) {
    const smsText = `🚨 Rappel RDV Proche : Votre proche a un rendez-vous/devoir : ${title} à ${time}.`;
    await scheduleSMS(phoneNumbersAppt, smsText, apptTime);
  }
};

/**
 * Cancels all notifications for a specific medication or appointment.
 * Note: expo-notifications doesn't have a direct "cancel by data property" for local notifications
 * without storing individual IDs. A common pattern is to cancel all and reschedule,
 * or we could just clear all if the user wants to refresh.
 * For now, we'll provide a way to cancel all to keep it simple,
 * or the user can manage IDs if they need more fine-grained control.
 */
export const cancelAllNotifications = async () => {
  await Notifications.cancelAllScheduledNotificationsAsync();
};
