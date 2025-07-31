import { useTranslation } from 'react-i18next';
import { SupportedLanguage } from '@/i18n/config';

export const useLanguage = () => {
  const { i18n } = useTranslation();
  
  const changeLanguage = (lng: SupportedLanguage) => {
    i18n.changeLanguage(lng);
  };
  
  const currentLanguage = i18n.language as SupportedLanguage;
  
  return {
    currentLanguage,
    changeLanguage,
    i18n
  };
};