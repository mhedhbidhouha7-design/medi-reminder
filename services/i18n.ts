import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { I18nManager } from "react-native";

import en from "../constants/locales/en.json";
import fr from "../constants/locales/fr.json";
import ar from "../constants/locales/ar.json";

const resources = {
  en: { translation: en },
  fr: { translation: fr },
  ar: { translation: ar },
};

export const LANGUAGE_KEY = "user-language";

// Simple detector that handles both RTL and language loading
const languageDetector: any = {
  type: "languageDetector",
  async: true,
  init: () => {},
  detect: (callback: (lang: string) => void) => {
    AsyncStorage.getItem(LANGUAGE_KEY)
      .then((savedLanguage) => {
        const lng = savedLanguage || "fr";
        const isRTL = lng === "ar";

        // Handle RTL initial state
        if (I18nManager.isRTL !== isRTL) {
          I18nManager.allowRTL(isRTL);
          I18nManager.forceRTL(isRTL);
        }

        callback(lng);
      })
      .catch(() => {
        callback("fr");
      });
  },
  cacheUserLanguage: (lng: string) => {
    AsyncStorage.setItem(LANGUAGE_KEY, lng).catch(() => {});
  },
};

i18n
  .use(initReactI18next)
  .use(languageDetector)
  .init({
    resources,
    fallbackLng: "fr",
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  });

export default i18n;
