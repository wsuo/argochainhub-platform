import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translation files
import zhTranslation from './locales/zh.json';
import enTranslation from './locales/en.json';
import esTranslation from './locales/es.json';

const resources = {
  zh: {
    translation: zhTranslation
  },
  en: {
    translation: enTranslation
  },
  es: {
    translation: esTranslation
  }
};

i18n
  // Detect user language
  .use(LanguageDetector)
  // Pass the i18n instance to react-i18next
  .use(initReactI18next)
  // Init i18next
  .init({
    resources,
    fallbackLng: 'en',
    debug: false,
    
    interpolation: {
      escapeValue: false // React already escapes values
    },
    
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage']
    }
  });

export default i18n;

// Export supported languages
export const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English', shortName: 'EN' },
  { code: 'zh', name: '中文', shortName: '中' },
  { code: 'es', name: 'Español', shortName: 'ES' }
] as const;

export type SupportedLanguage = typeof SUPPORTED_LANGUAGES[number]['code'];