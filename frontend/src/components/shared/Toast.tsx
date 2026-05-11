import { useEffect, useState } from "react";
import { CheckCircle2 } from "lucide-react";

interface ToastProps {
  message: string;
  visible: boolean;
  onHide: () => void;
  duration?: number;
}

export default function Toast({ message, visible, onHide, duration = 2000 }: ToastProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      const timer = setTimeout(() => {
        setMounted(false);
        setTimeout(onHide, 200);
      }, duration);
      return () => clearTimeout(timer);
    }
    setMounted(false);
  }, [visible, duration, onHide]);

  if (!mounted && !visible) return null;

  return (
    <div
      className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-xl border border-green-200 bg-white px-4 py-3 shadow-lg transition-all duration-200 ${
        mounted ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
      }`}
    >
      <CheckCircle2 className="h-4 w-4 text-green-600" />
      <span className="text-sm font-medium text-surface-900">{message}</span>
    </div>
  );
}
