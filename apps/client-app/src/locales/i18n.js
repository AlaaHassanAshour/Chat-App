import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import en from "./en/translation.json";
import ar from "./ar/translation.json";

// Initialize i18next
i18n
  .use(initReactI18next) // Passes i18n down to react-i18next
  .init({
    resources: {
      en: { translation: en },
      ar: { translation: ar },
    },
    fallbackLng: "en", // Default language if user language detection fails
    interpolation: {
      escapeValue: false, // React already protects from XSS
    },
  });

export default i18n;
