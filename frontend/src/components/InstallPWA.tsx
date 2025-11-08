import React, { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const InstallPWA: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showButton, setShowButton] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    if ((window.navigator as any).standalone === true) {
      setIsInstalled(true);
      return;
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowButton(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setShowButton(false);
      setDeferredPrompt(null);
    });

    // Show button after checking service worker
    const timer = setTimeout(async () => {
      if ('serviceWorker' in navigator) {
        try {
          const registration = await navigator.serviceWorker.getRegistration();
          if (registration && !isInstalled) {
            setShowButton(true);
          }
        } catch (error) {
          // Ignore errors
        }
      }
    }, 2000);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, [isInstalled]);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
          setIsInstalled(true);
        }
        setDeferredPrompt(null);
        setShowButton(false);
      } catch (error) {
        console.log('Install prompt error:', error);
        // If prompt fails, show guide
        setShowGuide(true);
      }
    } else {
      // Show guide with browser-specific instructions
      setShowGuide(true);
    }
  };

  const getBrowserInstructions = () => {
    const ua = navigator.userAgent;
    
    if (ua.includes('Edg/')) {
      return {
        browser: 'Microsoft Edge',
        steps: [
          'Click the menu button (⋯) in the top-right corner of the address bar',
          'Select "Apps" from the menu',
          'Click "Install this site as an app"',
          'Click "Install" in the confirmation dialog'
        ]
      };
    } else if (ua.includes('Chrome/') && !ua.includes('Edg/')) {
      return {
        browser: 'Google Chrome',
        steps: [
          'Look for the install icon (➕) in the address bar (right side)',
          'Click the install icon',
          'Click "Install" in the dialog that appears'
        ]
      };
    } else if (ua.includes('Firefox/')) {
      return {
        browser: 'Mozilla Firefox',
        steps: [
          'Click the menu button (☰) in the top-right corner',
          'Look for "Install" or "Install Site as App" option',
          'Click it and follow the prompts'
        ]
      };
    } else if (ua.includes('Safari/') && !ua.includes('Chrome/')) {
      return {
        browser: 'Safari',
        steps: [
          'Tap the Share button (square with arrow pointing up)',
          'Scroll down in the share menu',
          'Tap "Add to Home Screen"',
          'Tap "Add" in the top-right corner'
        ]
      };
    } else {
      return {
        browser: 'Your Browser',
        steps: [
          'Look for an install icon in your browser\'s address bar',
          'Or check your browser menu for "Install" option',
          'Follow the installation prompts'
        ]
      };
    }
  };

  if (isInstalled || !showButton) {
    return null;
  }

  const instructions = getBrowserInstructions();

  return (
    <>
      <button
        onClick={handleInstallClick}
        className="btn btn-outline btn-sm"
        title="Install this app on your device"
      >
        📲 Install
      </button>

      {showGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-neutral-900">
                  Install Christmas Wishlist
                </h2>
                <button
                  onClick={() => setShowGuide(false)}
                  className="text-neutral-500 hover:text-neutral-900 text-2xl"
                >
                  ✕
                </button>
              </div>

              <div className="mb-6">
                <p className="text-lg font-semibold text-neutral-700 mb-2">
                  Instructions for {instructions.browser}:
                </p>
                <ol className="list-decimal list-inside space-y-2 text-neutral-600">
                  {instructions.steps.map((step, index) => (
                    <li key={index} className="pl-2">{step}</li>
                  ))}
                </ol>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <h3 className="font-semibold text-blue-900 mb-2">💡 Tips:</h3>
                <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                  <li>Make sure you're visiting the app over HTTPS (or localhost for development)</li>
                  <li>The install option may take a few seconds to appear</li>
                  <li>Once installed, the app will work offline and update automatically</li>
                </ul>
              </div>

              <button
                onClick={() => setShowGuide(false)}
                className="btn btn-primary w-full"
              >
                Got it!
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

