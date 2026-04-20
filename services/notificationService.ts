import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { getProches } from "../controllers/procheController";
import { Appointment, Medication } from "../models/interfaces";
import { getNotificationContent } from "./notificationMessages";
import { scheduleSMS } from "./smsService";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
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
    // Canal standard pour les rappels simples
    await Notifications.setNotificationChannelAsync("reminders", {
      name: "Rappels médicaments",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF231F7C",
    });

    // Canal haute priorité pour l'heure de prise — passe en plein écran
    await Notifications.setNotificationChannelAsync("medication-alert", {
      name: "Alerte prise médicament",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 500, 200, 500],
      lightColor: "#FF0000",
      bypassDnd: true,
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      enableLights: true,
      enableVibrate: true,
      showBadge: true,
    });
  }

  return true;
};

const parseTime = (timeStr: string): { hours: number; minutes: number } => {
  const parts = timeStr.split(":");
  if (parts.length === 2) {
    const hours = parseInt(parts[0], 10);
    const minutes = parseInt(parts[1], 10);
    if (!isNaN(hours) && !isNaN(minutes)) return { hours, minutes };
  }
  const lower = timeStr.toLowerCase();
  if (lower.includes("morning")) return { hours: 8, minutes: 0 };
  if (lower.includes("noon") || lower.includes("midday"))
    return { hours: 12, minutes: 0 };
  if (lower.includes("afternoon")) return { hours: 14, minutes: 0 };
  if (lower.includes("evening")) return { hours: 19, minutes: 0 };
  if (lower.includes("night")) return { hours: 22, minutes: 0 };
  return { hours: 9, minutes: 0 };
};

export const scheduleMedicationReminders = async (
  userId: string,
  medication: Medication,
) => {
  const { schedules, startDate, endDate, name } = medication;
  const proches = await getProches(userId);

  const [sYear, sMonth, sDay] = startDate.split("-").map(Number);
  const [eYear, eMonth, eDay] = endDate.split("-").map(Number);
  const start = new Date(sYear, sMonth - 1, sDay);
  const end = new Date(eYear, eMonth - 1, eDay);
  end.setHours(23, 59, 59, 999);

  const today = new Date();
  const todayMidnight = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );

  const scheduleUntil = new Date(todayMidnight);
  scheduleUntil.setDate(todayMidnight.getDate() + 7);
  scheduleUntil.setHours(23, 59, 59, 999);

  const finalEndDate = end < scheduleUntil ? end : scheduleUntil;
  const d = new Date(start > todayMidnight ? start : todayMidnight);
  const phoneNumbers = proches
    .map((p) => p.phone)
    .filter(Boolean)
    .join(",");

  while (d <= finalEndDate) {
    for (const schedule of schedules) {
      const { hours, minutes } = parseTime(schedule.time);
      const doseTime = new Date(d);
      doseTime.setHours(hours, minutes, 0, 0);
      if (doseTime <= today) continue;

      const msgParams = { medicationName: name, dose: schedule.dose };

      // 1. Rappel 30 min avant — canal standard
      const reminder30 = new Date(doseTime.getTime() - 30 * 60 * 1000);
      if (reminder30 > today) {
        const msg30 = getNotificationContent(
          "medication_reminder_30",
          msgParams,
        );
        const content: any = {
          title: msg30.title,
          body: msg30.body,
          sound: "default",
          data: {
            medId: medication.id,
            type: "medication_reminder_30",
            medicationName: name,
            dose: schedule.dose,
            isFullScreen: false,
          },
        };
        if (Platform.OS === "android") content.channelId = "reminders";
        await Notifications.scheduleNotificationAsync({
          content,
          trigger: { type: "date", date: reminder30 } as any,
        });
        if (phoneNumbers)
          await scheduleSMS(phoneNumbers, msg30.sms, reminder30);
      }

      // 2. Rappel 15 min avant — canal standard
      const reminder15 = new Date(doseTime.getTime() - 15 * 60 * 1000);
      if (reminder15 > today) {
        const msg15 = getNotificationContent(
          "medication_reminder_15",
          msgParams,
        );
        const content: any = {
          title: msg15.title,
          body: msg15.body,
          sound: "default",
          data: {
            medId: medication.id,
            type: "medication_reminder_15",
            medicationName: name,
            dose: schedule.dose,
            isFullScreen: false,
          },
        };
        if (Platform.OS === "android") content.channelId = "reminders";
        await Notifications.scheduleNotificationAsync({
          content,
          trigger: { type: "date", date: reminder15 } as any,
        });
        if (phoneNumbers)
          await scheduleSMS(phoneNumbers, msg15.sms, reminder15);
      }

      // 3. Heure exacte — canal haute priorité + plein écran
      const msgDose = getNotificationContent("medication_dose", msgParams);
      const doseContent: any = {
        title: msgDose.title,
        body: msgDose.body,
        sound: true,
        priority: "max",
        data: {
          medId: medication.id,
          type: "medication_dose",
          medicationName: name,
          dose: schedule.dose,
          scheduledTime: doseTime.toLocaleTimeString("fr-FR", {
            hour: "2-digit",
            minute: "2-digit",
          }),
          isFullScreen: true, // ← flag lu par le handler
        },
      };
      // Canal dédié plein écran sur Android
      if (Platform.OS === "android") doseContent.channelId = "medication-alert";

      await Notifications.scheduleNotificationAsync({
        content: doseContent,
        trigger: { type: "date", date: doseTime } as any,
      });
      if (phoneNumbers) await scheduleSMS(phoneNumbers, msgDose.sms, doseTime);
    }
    d.setDate(d.getDate() + 1);
  }
};

export const scheduleAppointmentReminders = async (
  userId: string,
  appointment: Appointment,
) => {
  const { date, time, title, id } = appointment;
  const proches = await getProches(userId);
  const phoneNumbers = proches
    .map((p) => p.phone)
    .filter(Boolean)
    .join(",");

  const [year, month, day] = date.split("-").map(Number);
  const { hours, minutes } = parseTime(time);
  const apptTime = new Date(year, month - 1, day, hours, minutes, 0, 0);
  const today = new Date();
  if (apptTime <= today) return;

  const apptParams = { appointmentTitle: title, date, time };

  const twoDaysBefore = new Date(apptTime.getTime() - 2 * 24 * 60 * 60 * 1000);
  if (twoDaysBefore > today) {
    const msg2d = getNotificationContent("appointment_2d", apptParams);
    const content: any = {
      title: msg2d.title,
      body: msg2d.body,
      data: {
        apptId: id,
        type: "appointment_2d",
        appointmentTitle: title,
        time,
      },
    };
    if (Platform.OS === "android") content.channelId = "reminders";
    await Notifications.scheduleNotificationAsync({
      content,
      trigger: { type: "date", date: twoDaysBefore } as any,
    });
    if (phoneNumbers) await scheduleSMS(phoneNumbers, msg2d.sms, twoDaysBefore);
  }

  const oneDayBefore = new Date(apptTime.getTime() - 24 * 60 * 60 * 1000);
  if (oneDayBefore > today) {
    const msg1d = getNotificationContent("appointment_1d", apptParams);
    const content: any = {
      title: msg1d.title,
      body: msg1d.body,
      data: {
        apptId: id,
        type: "appointment_1d",
        appointmentTitle: title,
        time,
      },
    };
    if (Platform.OS === "android") content.channelId = "reminders";
    await Notifications.scheduleNotificationAsync({
      content,
      trigger: { type: "date", date: oneDayBefore } as any,
    });
    if (phoneNumbers) await scheduleSMS(phoneNumbers, msg1d.sms, oneDayBefore);
  }

  const fiveHoursBefore = new Date(apptTime.getTime() - 5 * 60 * 60 * 1000);
  if (fiveHoursBefore > today) {
    const msg5h = getNotificationContent("appointment_5h", apptParams);
    const content: any = {
      title: msg5h.title,
      body: msg5h.body,
      data: {
        apptId: id,
        type: "appointment_5h",
        appointmentTitle: title,
        time,
      },
    };
    if (Platform.OS === "android") content.channelId = "reminders";
    await Notifications.scheduleNotificationAsync({
      content,
      trigger: { type: "date", date: fiveHoursBefore } as any,
    });
    if (phoneNumbers)
      await scheduleSMS(phoneNumbers, msg5h.sms, fiveHoursBefore);
  }

  const msgNow = getNotificationContent("appointment_now", apptParams);
  const contentNow: any = {
    title: msgNow.title,
    body: msgNow.body,
    sound: true,
    data: {
      apptId: id,
      type: "appointment_now",
      appointmentTitle: title,
      time,
    },
  };
  if (Platform.OS === "android") contentNow.channelId = "reminders";
  await Notifications.scheduleNotificationAsync({
    content: contentNow,
    trigger: { type: "date", date: apptTime } as any,
  });
  if (phoneNumbers) await scheduleSMS(phoneNumbers, msgNow.sms, apptTime);
};

export const testNotifications = async () => {
  const now = Date.now();
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "⏰ TEST - 30 min avant",
      body: "Vous devez prendre Doliprane (500mg) dans 30 minutes.",
      data: { type: "test_30" },
      sound: false,
    },
    trigger: { type: "date", date: new Date(now + 5 * 1000) } as any,
  });
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "⚠️ TEST - 15 min avant",
      body: "Vous devez prendre Doliprane (500mg) dans 15 minutes.",
      data: { type: "test_15" },
      sound: false,
    },
    trigger: { type: "date", date: new Date(now + 10 * 1000) } as any,
  });
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "💊 TEST - Heure du médicament !",
      body: "C'est l'heure de prendre votre Doliprane (500mg).",
      data: {
        type: "medication_dose",
        medicationName: "Doliprane",
        dose: "500mg",
        isFullScreen: true,
      },
      sound: true,
    },
    trigger: { type: "date", date: new Date(now + 15 * 1000) } as any,
  });
  console.log("✅ 3 test notifications scheduled: 5s, 10s, 15s from now");
};

export const cancelAllNotifications = async () => {
  await Notifications.cancelAllScheduledNotificationsAsync();
};
