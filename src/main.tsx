import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';
import { LanguageProvider } from './i18n/LanguageContext';
import { getDisplayLanguage } from './settings/gameSettings';

const initialLanguage = getDisplayLanguage();
document.documentElement.lang = initialLanguage === 'zh' ? 'zh-Hant' : 'en';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LanguageProvider>
      <App />
    </LanguageProvider>
  </StrictMode>,
);
