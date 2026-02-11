import { useState, useEffect } from "react";
import { CheckCircle2 } from "lucide-react";

interface SuccessMessageProps {
  message?: string;
  onClose?: () => void;
}

export function SuccessMessage({ message, onClose }: SuccessMessageProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    setIsVisible(true);
    const timer = setTimeout(() => {
      setIsVisible(false);
      onClose?.();
    }, 5000);

    return () => clearTimeout(timer);
  }, [message, onClose]);

  if (!isVisible || !message) return null;

  return (
    <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-300 rounded-md text-sm transition-all animate-in fade-in slide-in-from-top-2 duration-500">
      <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400 shrink-0" />
      <span className="font-medium">{message}</span>
    </div>
  );
}
