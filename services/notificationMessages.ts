export type NotificationType =
  | "medication_reminder_30"
  | "medication_reminder_15"
  | "medication_dose"
  | "appointment_2d"
  | "appointment_1d"
  | "appointment_5h"
  | "appointment_now";

export interface NotificationParams {
  medicationName?: string;
  dose?: string;
  appointmentTitle?: string;
  date?: string;
  time?: string;
}

export interface NotificationContent {
  title: string;
  body: string;
  speech: string;
  email: string;
}

export const getNotificationContent = (
  type: NotificationType,
  params: NotificationParams = {},
): NotificationContent => {
  const { medicationName, dose, appointmentTitle, date, time } = params;

  const messages: Record<NotificationType, NotificationContent> = {
    medication_reminder_30: {
      title: "⏰ Rappel de médicament",
      body: `Vous devez prendre ${medicationName} (${dose}) dans 30 minutes.`,
      speech: `Attention ! Vous devez prendre ${medicationName}, avec ${dose} dose(s), dans 30 minutes.`,
      email: `⏰ Rappel Proche : Votre proche doit prendre ${medicationName} (${dose}) dans 30 minutes.`,
    },
    medication_reminder_15: {
      title: "⚠️ Rappel de médicament",
      body: `Vous devez prendre ${medicationName} (${dose}) dans 15 minutes.`,
      speech: `Rappel urgent ! Prenez ${medicationName}, avec ${dose} dose(s), dans 15 minutes.`,
      email: `⚠️ Rappel Proche : Votre proche doit prendre ${medicationName} (${dose}) dans 15 minutes.`,
    },
    medication_dose: {
      title: "💊 Heure du médicament !",
      body: `C'est l'heure de prendre votre ${medicationName} avec (${dose}) dose(s).`,
      speech: `C'est l'heure ! Prenez votre médicament ${medicationName}, avec ${dose} dose(s), maintenant.`,
      email: `🚨 Rappel Proche : Il est l'heure pour votre proche de prendre son médicament : ${medicationName} (${dose}).`,
    },
    appointment_2d: {
      title: "📅 Devoir/RDV dans 2 jours",
      body: `Rappel : ${appointmentTitle} est dans 2 jours (le ${date} à ${time}).`,
      speech: `Rappel. Vous avez un rendez-vous : ${appointmentTitle}, dans 2 jours.`,
      email: `📅 Rappel RDV Proche : Votre proche a un rendez-vous (${appointmentTitle}) dans 2 jours (le ${date} à ${time}).`,
    },
    appointment_1d: {
      title: "⚠️ Devoir/RDV demain",
      body: `Rappel : ${appointmentTitle} est demain à ${time}.`,
      speech: `Rappel. Vous avez un rendez-vous : ${appointmentTitle}, demain à ${time}.`,
      email: `⚠️ Rappel RDV Proche : Votre proche a un rendez-vous (${appointmentTitle}) demain à ${time}.`,
    },
    appointment_5h: {
      title: "⏰ Devoir/RDV aujourd'hui",
      body: `Votre rendez-vous ${appointmentTitle} est dans 5 heures.`,
      speech: `Attention. Votre rendez-vous : ${appointmentTitle}, est dans 5 heures, à ${time}.`,
      email: `⏰ Rappel RDV Proche : Votre proche a un rendez-vous (${appointmentTitle}) dans quelques heures (à ${time}).`,
    },
    appointment_now: {
      title: "🚀 C'est l'heure !",
      body: `Il est temps pour votre RDV : ${appointmentTitle}.`,
      speech: `C'est l'heure ! Votre rendez-vous : ${appointmentTitle}, commence maintenant.`,
      email: `🚨 Rappel RDV Proche : Votre proche a un rendez-vous/devoir : ${appointmentTitle} à ${time}.`,
    },
  };

  return messages[type] || {
    title: "🔔 Notification",
    body: "Vous avez une nouvelle notification.",
    speech: "Vous avez une nouvelle notification.",
    email: "🔔 Nouvelle notification.",
  };
};
