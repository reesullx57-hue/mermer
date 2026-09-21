'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2, XCircle, X } from 'lucide-react';

export type ToastType = 'success' | 'error';

interface ToastProps {
  message: string;
  type: ToastType;
  onClose: () => void;
}

export function Toast({ message, type, onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div
      className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg min-w-[300px] max-w-md ${
        type === 'success'
          ? 'bg-green-50 border border-green-200'
          : 'bg-red-50 border border-red-200'
      }`}
    >
      {type === 'success' ? (
        <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
      ) : (
        <XCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
      )}
      <p
        className={`flex-1 text-sm font-medium ${
          type === 'success' ? 'text-green-900' : 'text-red-900'
        }`}
      >
        {message}
      </p>
      <button
        onClick={onClose}
        className={`flex-shrink-0 ${
          type === 'success'
            ? 'text-green-600 hover:text-green-800'
            : 'text-red-600 hover:text-red-800'
        }`}
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

interface ToastMessage {
  id: number;
  message: string;
  type: ToastType;
}

let toastId = 0;
const toastListeners: Array<(toast: ToastMessage) => void> = [];

export function showToast(message: string, type: ToastType = 'success') {
  const toast: ToastMessage = {
    id: ++toastId,
    message,
    type,
  };
  toastListeners.forEach((listener) => listener(toast));
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    const listener = (toast: ToastMessage) => {
      setToasts((prev) => [...prev, toast]);
    };
    toastListeners.push(listener);
    return () => {
      const index = toastListeners.indexOf(listener);
      if (index > -1) toastListeners.splice(index, 1);
    };
  }, []);

  const removeToast = (id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <>
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </>
  );
}
