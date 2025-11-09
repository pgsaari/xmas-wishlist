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
    /**
     * PWA Installation Detection Strategy:
     * 
     * 1. Standalone Mode Check (Currently Running as PWA):
     *    - If display-mode is 'standalone', the app is running as an installed PWA
     *    - iOS Safari uses navigator.standalone property
     *    - In this case, hide the install button immediately
     * 
     * 2. beforeinstallprompt Event (Primary Detection):
     *    - Browsers fire this event ONLY when:
     *      a) The PWA meets installation criteria (manifest, service worker, HTTPS)
     *      b) The PWA is NOT already installed
     *    - If the PWA is already installed, browsers WON'T fire this event
     *    - This is the primary mechanism browsers use to prevent showing install
     *      prompts for already-installed PWAs, even when viewing in a browser tab
     * 
     * 3. getInstalledRelatedApps() API (Optional, Limited Support):
     *    - Can explicitly check if the app is installed
     *    - Requires manifest configuration with related_applications
     *    - Limited browser support (Chrome 84+ on Android, Chrome 140+ on desktop)
     *    - Falls back to beforeinstallprompt behavior if not available
     * 
     * 4. appinstalled Event:
     *    - Fires when user completes installation
     *    - Used to update state after installation
     */

    // Check if currently running as PWA (standalone mode)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                         (window.navigator as any).standalone === true;
    
    if (isStandalone) {
      setIsInstalled(true);
      setShowButton(false);
      return;
    }

    // Optional: Check if PWA is already installed using getInstalledRelatedApps API
    // This provides explicit detection even when viewing in a browser tab
    if ('getInstalledRelatedApps' in navigator) {
      (navigator as any).getInstalledRelatedApps().then((apps: any[]) => {
        if (apps && apps.length > 0) {
          // PWA is already installed - hide install button
          setIsInstalled(true);
          setShowButton(false);
        }
      }).catch(() => {
        // API not fully supported or error - fall back to beforeinstallprompt
      });
    }

    // Listen for beforeinstallprompt event
    // This event ONLY fires if:
    // - PWA meets installation criteria (manifest, service worker, HTTPS)
    // - PWA is NOT already installed
    // Browsers automatically prevent this event if the PWA is already installed,
    // even when viewing the site in a browser tab (not standalone mode)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowButton(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Listen for successful installation
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setShowButton(false);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

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

  // Final check before rendering button:
  // 1. Don't show if already marked as installed
  // 2. Don't show if currently running in standalone mode (PWA mode)
  // 3. Only show if beforeinstallprompt event fired (showButton is true)
  //    This ensures the button only appears when install capability is available
  //    and the PWA is not already installed
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                       (window.navigator as any).standalone === true;
  
  if (isInstalled || isStandalone || !showButton) {
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

