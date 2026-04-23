import i18n from 'i18next';
import {initReactI18next} from 'react-i18next';
import {getLocales} from 'react-native-localize';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const LANGUAGE_KEY = '@arcc_language';
import en from './locales/en.json';
import zh from './locales/zh.json';
import fr from './locales/fr.json';
import it from './locales/it.json';
import de from './locales/de.json';
import es from './locales/es.json';
import ja from './locales/ja.json';
import ko from './locales/ko.json';
import pl from './locales/pl.json';
import ptBR from './locales/pt-BR.json';
import ru from './locales/ru.json';
import zhTW from './locales/zh-TW.json';
import tr from './locales/tr.json';

const supportedLanguages = [
  'en', 'zh', 'fr', 'it', 'de', 'es', 'ja', 'ko', 'pl', 'pt', 'ru', 'tr',
];

const locale = getLocales()[0];
const languageCode = locale?.languageCode ?? 'en';
const scriptCode = locale?.scriptCode;

function getDeviceLanguage(): string {
  // Handle Chinese variants: Traditional vs Simplified
  if (languageCode === 'zh') {
    if (scriptCode === 'Hant') return 'zh-TW';
    return 'zh';
  }
  // Handle Portuguese (Brazil)
  if (languageCode === 'pt') return 'pt-BR';
  // Match supported languages
  if (supportedLanguages.includes(languageCode)) return languageCode;
  return 'en';
}

i18n.use(initReactI18next).init({
  resources: {
    en: {translation: en},
    zh: {translation: zh},
    fr: {translation: fr},
    it: {translation: it},
    de: {translation: de},
    es: {translation: es},
    ja: {translation: ja},
    ko: {translation: ko},
    pl: {translation: pl},
    'pt-BR': {translation: ptBR},
    ru: {translation: ru},
    'zh-TW': {translation: zhTW},
    tr: {translation: tr},
  },
  lng: getDeviceLanguage(),
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
});

// Restore saved language preference (overrides device default)
AsyncStorage.getItem(LANGUAGE_KEY).then(saved => {
  if (saved && saved !== i18n.language) {
    i18n.changeLanguage(saved);
  }
}).catch(() => {});

export default i18n;
