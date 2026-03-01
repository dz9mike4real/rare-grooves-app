'use client';

import * as React from 'react';
import { notifications } from '@mantine/notifications';

interface ToastProps {
  title?: React.ReactNode;
  description?: React.ReactNode;
  duration?: number;
  variant?: 'default' | 'destructive';
}

export function toast({ title, description, duration, variant }: ToastProps) {
  return notifications.show({
    title,
    message: description,
    autoClose: duration || 4000,
    color: variant === 'destructive' ? 'red' : 'blue',
  });
}

export function useToast() {
  return {
    toast,
    dismiss: (id?: string) => {
      if (id) {
        notifications.hide(id);
      } else {
        notifications.clean();
      }
    },
  };
}
