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
// step 1/5
