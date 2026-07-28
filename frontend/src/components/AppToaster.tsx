import { Toaster } from 'react-hot-toast';

/**
 * Toasts style react-hot-toast (succès / erreur, barre de progression, bouton fermer).
 */
export function AppToaster() {
  return (
    <Toaster
      position="top-right"
      reverseOrder={false}
      gutter={10}
      containerStyle={{
        top: 16,
        right: 16,
        zIndex: 99999,
      }}
      toastOptions={{
        duration: 4000,
        style: {
          maxWidth: 420,
          padding: '12px 14px',
          borderRadius: '8px',
          background: '#ffffff',
          color: '#1f2937',
          boxShadow:
            '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
          fontSize: '14px',
          lineHeight: '1.4',
        },
        success: {
          duration: 3500,
          iconTheme: {
            primary: '#22c55e',
            secondary: '#ffffff',
          },
        },
        error: {
          duration: 4500,
          iconTheme: {
            primary: '#ef4444',
            secondary: '#ffffff',
          },
        },
      }}
    />
  );
}
