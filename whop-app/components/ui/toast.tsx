"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface ToastProps {
  message: string;
  type?: "success" | "error" | "warning" | "info";
  duration?: number;
  onClose?: () => void;
  className?: string;
}

export function Toast({ 
  message, 
  type = "info", 
  duration = 3000, 
  onClose,
  className 
}: ToastProps) {
  const [isVisible, setIsVisible] = React.useState(true);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => onClose?.(), 300); // Wait for animation to complete
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const getTypeStyles = () => {
    switch (type) {
      case "success":
        return "bg-gradient-to-r from-primary/90 to-accent/90 border-primary/50 text-white";
      case "error":
        return "bg-gradient-to-r from-red-500/90 to-rose-500/90 border-red-400/50 text-white";
      case "warning":
        return "bg-gradient-to-r from-amber-500/90 to-orange-500/90 border-amber-400/50 text-white";
      default:
        return "bg-gradient-to-r from-slate-700/90 to-slate-800/90 border-slate-600/50 text-white";
    }
  };

  const getIcon = () => {
    switch (type) {
      case "success":
        return "✅";
      case "error":
        return "❌";
      case "warning":
        return "⚠️";
      default:
        return "ℹ️";
    }
  };

  return (
    <div
      className={cn(
        "fixed top-4 right-4 z-50 max-w-sm w-full mx-4",
        "transform transition-all duration-300 ease-in-out",
        isVisible 
          ? "translate-x-0 opacity-100 scale-100" 
          : "translate-x-full opacity-0 scale-95",
        className
      )}
    >
      <div
        className={cn(
          "backdrop-blur-xl rounded-xl p-4 shadow-2xl border",
          "flex items-center gap-3",
          getTypeStyles()
        )}
      >
        <span className="text-lg flex-shrink-0">{getIcon()}</span>
        <p className="font-semibold text-sm leading-tight flex-1">{message}</p>
        <button
          onClick={() => {
            setIsVisible(false);
            setTimeout(() => onClose?.(), 300);
          }}
          className="flex-shrink-0 w-6 h-6 rounded-full bg-white/20 hover:bg-white/30 transition-colors duration-200 flex items-center justify-center"
        >
          <span className="text-xs">×</span>
        </button>
      </div>
    </div>
  );
}

// Toast container component
interface ToastContainerProps {
  children: React.ReactNode;
}

export function ToastContainer({ children }: ToastContainerProps) {
  return (
    <div className="fixed top-0 right-0 z-50 pointer-events-none">
      <div className="flex flex-col gap-2 p-4 pointer-events-auto">
        {children}
      </div>
    </div>
  );
}
