import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import landingEn from './locales/landing/en.json';
import landingId from './locales/landing/id.json';
import layoutEn from './locales/layout/en.json';
import layoutId from './locales/layout/id.json';
import optionsEn from './locales/options/en.json';
import optionsId from './locales/options/id.json';
import claimBpjsEn from './locales/claim-bpjs/en.json';
import claimBpjsId from './locales/claim-bpjs/id.json';
import medicalScribeEn from './locales/medical-scribe/en.json';
import medicalScribeId from './locales/medical-scribe/id.json';
import medicalChatbotEn from './locales/medical-chatbot/en.json';
import medicalChatbotId from './locales/medical-chatbot/id.json';
import authEn from './locales/auth/en.json';
import authId from './locales/auth/id.json';
import radiologyEn from './locales/radiology/en.json';
import radiologyId from './locales/radiology/id.json';
import reservationEn from './locales/reservation/en.json';
import reservationId from './locales/reservation/id.json';
import whatsappEn from './locales/whatsapp/en.json';
import whatsappId from './locales/whatsapp/id.json';
import agentEn from './locales/agent/en.json';
import agentId from './locales/agent/id.json';
import adminEn from './locales/admin/en.json';
import adminId from './locales/admin/id.json';
import commonEn from './locales/common/en.json';
import commonId from './locales/common/id.json';
import guideEn from './locales/guide/en.json';
import guideId from './locales/guide/id.json';
import settingsEn from './locales/settings/en.json';
import settingsId from './locales/settings/id.json';
import modelManagementEn from './locales/model-management/en.json';
import modelManagementId from './locales/model-management/id.json';
import analyticsEn from './locales/analytics/en.json';
import analyticsId from './locales/analytics/id.json';

const resources = {
  en: {
    translation: {
      landing: landingEn,
      layout: layoutEn,
      options: optionsEn,
      claimBpjs: claimBpjsEn,
      scribe: medicalScribeEn,
      chatbot: medicalChatbotEn,
      auth: authEn,
      radiology: radiologyEn,
      reservation: reservationEn,
      whatsapp: whatsappEn,
      agent: agentEn,
      admin: adminEn,
      common: commonEn,
      guide: guideEn,
      settings: settingsEn,
      modelManagement: modelManagementEn,
      analytics: analyticsEn
    }
  },
  id: {
    translation: {
      landing: landingId,
      layout: layoutId,
      options: optionsId,
      claimBpjs: claimBpjsId,
      scribe: medicalScribeId,
      chatbot: medicalChatbotId,
      auth: authId,
      radiology: radiologyId,
      reservation: reservationId,
      whatsapp: whatsappId,
      agent: agentId,
      admin: adminId,
      common: commonId,
      guide: guideId,
      settings: settingsId,
      modelManagement: modelManagementId,
      analytics: analyticsId
    }
  }
};

// Check if user has explicitly saved language preference, else default to 'en' (English)
const savedLanguage = typeof window !== 'undefined' ? localStorage.getItem('i18nextLng') : null;
const initialLanguage = (savedLanguage && ['en', 'id'].includes(savedLanguage)) ? savedLanguage : 'en';

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: initialLanguage,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false // react already protects from xss
    }
  });

// Always sync language changes back to localStorage
i18n.on('languageChanged', (lng) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('i18nextLng', lng);
  }
});

export default i18n;
