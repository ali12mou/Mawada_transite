import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { LanguageProvider } from './contexts/LanguageContext';
import { CurrencyProvider } from './contexts/CurrencyContext';
import { AppToaster } from './components/AppToaster';
import { ConfirmDialogHost } from './components/ConfirmDialogHost';
import { installAppAlert } from './lib/appToast';

installAppAlert();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LanguageProvider>
      <CurrencyProvider>
        <AppToaster />
        <ConfirmDialogHost />
        <App />
      </CurrencyProvider>
    </LanguageProvider>
  </StrictMode>
);
