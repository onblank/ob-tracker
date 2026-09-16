import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

i18n.use(initReactI18next).init({
  fallbackLng: 'en',
  lng: navigator.language.toLowerCase().startsWith('es') ? 'es' : 'en',
  interpolation: { escapeValue: false },
  resources: {
    en: { translation: {
      welcome: 'Welcome to OB-Tracker',
      onboardingSubtitle: 'A fully offline time tracker. Your data stays on this computer.',
      displayName: 'Display name', companyName: 'Company name', optional: 'optional', language: 'Language',
      currency: 'Currency', workType: 'Default work type', billingModel: 'Default billing model', hourlyRate: 'Default hourly rate',
      start: 'Start using OB-Tracker',
    } },
    es: { translation: {
      welcome: 'Bienvenido a OB-Tracker',
      onboardingSubtitle: 'Un gestor de tiempo completamente offline. Tus datos se quedan en este ordenador.',
      displayName: 'Nombre visible', companyName: 'Empresa', optional: 'opcional', language: 'Idioma',
      currency: 'Moneda', workType: 'Tipo de trabajo por defecto', billingModel: 'Facturación por defecto', hourlyRate: 'Tarifa por hora por defecto',
      start: 'Empezar a usar OB-Tracker',
    } },
  },
});

export default i18n;
