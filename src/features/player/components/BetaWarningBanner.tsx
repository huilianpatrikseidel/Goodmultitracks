import React, { useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { Button } from '../../../components/ui/button';

/**
 * CRITICAL QA FIX: Beta Warning Banner
 * 
 * Displays a dismissible warning about audio sync limitations due to HTML5 Audio engine.
 * This addresses QA requirement: "If the Web Audio API refactor is too complex,
 * add a warning about 'Beta / Sync not guaranteed' in the UI."
 */
export const BetaWarningBanner = () => {
  const [dismissed, setDismissed] = useState(() => {
    return localStorage.getItem('beta-warning-dismissed') === 'true';
  });

  const handleDismiss = () => {
    localStorage.setItem('beta-warning-dismissed', 'true');
    setDismissed(true);
  };

  if (dismissed) return null;

  return (
    <div 
      className="flex items-start gap-3 px-4 py-2 border-b text-sm"
      style={{
        backgroundColor: 'rgba(251, 191, 36, 0.1)',
        borderColor: 'rgba(251, 191, 36, 0.3)',
      }}
    >
      <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0 text-yellow-500" />
      <div className="flex-1 min-w-0">
        <p className="text-yellow-200">
          <strong className="font-semibold">Beta Notice:</strong>{' '}
          Multi-track sync is not sample-accurate due to HTML5 Audio limitations. 
          Minor timing drift may occur on slower devices or with 10+ tracks. 
          Professional Web Audio API implementation coming soon.
        </p>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 flex-shrink-0 hover:bg-yellow-900/30 text-yellow-400"
        onClick={handleDismiss}
        title="Dismiss warning"
      >
        <X className="w-3 h-3" />
      </Button>
    </div>
  );
};
