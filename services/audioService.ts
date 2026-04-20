import * as Speech from "expo-speech";
import {
    getNotificationContent,
    NotificationParams,
    NotificationType,
} from "./notificationMessages";

export const speakNotification = (
  type: NotificationType,
  params: NotificationParams = {},
) => {
  Speech.stop();
  const { speech } = getNotificationContent(type, params);
  Speech.speak(speech, {
    language: "fr-FR",
    pitch: 1.0,
    rate: 0.85,
    onDone: () => console.log("Message lu"),
    onError: (e) => console.error("Erreur speech:", e),
  });
};

export const stopSpeech = () => {
  Speech.stop();
};
