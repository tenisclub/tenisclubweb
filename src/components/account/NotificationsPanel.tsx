'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Bell, CheckCheck } from 'lucide-react';
import { cn, formatDateTime } from '@/lib/utils';
import type { NotificationItem } from '@/types/database';

export function NotificationsPanel({
  initialNotifications,
  scope = 'customer',
}: {
  initialNotifications: NotificationItem[];
  scope?: 'customer' | 'admin';
}) {
  const [items, setItems] = useState<NotificationItem[]>(initialNotifications);

  useEffect(() => {
    setItems(initialNotifications);
  }, [initialNotifications]);

  const unreadCount = items.filter((n) => !n.is_read).length;

  const markAllRead = async () => {
    setItems((prev) => prev.map((n) => ({ ...n, is_read: true })));
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ markAll: true, scope }),
    });
  };

  if (items.length === 0) return null;

  return (
    <div className="rounded-3xl border border-zinc-800 bg-[#121216] p-4 sm:p-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-[#BEFA46]" />
          <h3 className="text-base font-black text-white">Notificações</h3>
          {unreadCount > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-[#BEFA46] text-[#09090B] text-[10px] font-black">
              {unreadCount} nova(s)
            </span>
          )}
