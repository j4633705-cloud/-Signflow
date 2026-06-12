import { LightbulbIcon, XIcon } from 'lucide-react';
import { useState } from 'react';

type ContextualTipProps = {
  id: string;
  title: string;
  children: React.ReactNode;
};

export const ContextualTip = ({ id, title, children }: ContextualTipProps) => {
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(`tip_dismissed_${id}`) === 'true';
    }
    return false;
  });

  if (dismissed) {
    return null;
  }

  const handleDismiss = () => {
    localStorage.setItem(`tip_dismissed_${id}`, 'true');
    setDismissed(true);
  };

  return (
    <div className="mb-4 flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm dark:border-blue-800 dark:bg-blue-950">
      <LightbulbIcon className="mt-0.5 h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" />
      <div className="flex-1">
        <p className="font-medium text-blue-800 dark:text-blue-300">{title}</p>
        <div className="mt-1 text-blue-700 dark:text-blue-400">{children}</div>
      </div>
      <button onClick={handleDismiss} className="shrink-0 text-blue-400 hover:text-blue-600" aria-label="Dismiss tip">
        <XIcon className="h-4 w-4" />
      </button>
    </div>
  );
};
