import React, { useState, useEffect } from 'react';
// @ts-ignore - virtual module provided by vite-plugin-pwa
import { useRegisterSW } from 'virtual:pwa-register/react';

export const UpdateAvailable: React.FC = () => {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r: any) {
      console.log('SW Registered: ', r);
    },
    onRegisterError(error: any) {
      console.log('SW registration error', error);
    },
  });

  const [showUpdate, setShowUpdate] = useState(false);

  useEffect(() => {
    if (needRefresh) {
      setShowUpdate(true);
    }
  }, [needRefresh]);

  const handleUpdate = () => {
    updateServiceWorker(true);
    setShowUpdate(false);
  };

  const handleDismiss = () => {
    setShowUpdate(false);
    setNeedRefresh(false);
  };

  if (!showUpdate) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm animate-slide-up">
      <div className="card card-normal shadow-2xl border-2 border-primary-500 bg-white">
        <div className="flex items-start gap-3">
          <span className="text-2xl">🔄</span>
          <div className="flex-1">
            <h3 className="font-bold text-neutral-900 mb-1">Update Available</h3>
            <p className="text-sm text-neutral-600 mb-3">
              A new version of the app is available. Would you like to update?
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleUpdate}
                className="btn btn-primary btn-sm"
              >
                Update Now
              </button>
              <button
                onClick={handleDismiss}
                className="btn btn-outline btn-sm"
              >
                Later
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

