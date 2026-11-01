'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

const ALL_HERO_VIDEOS: string[] = [
  '/videos/hero-01.mp4',
  '/videos/hero-02.mp4?v=2',
  '/videos/hero-03.mp4?v=2',
  '/videos/hero-04.mp4?v=2',
  '/videos/hero-05.mp4',
  '/videos/hero-06.mp4',
  '/videos/hero-07.mp4',
  '/videos/hero-08.mp4',
  '/videos/hero-09.mp4',
  '/videos/hero-10.mp4',
];

const LAST_HERO_START_KEY = 'tc_last_hero_start_v1';

function shuffleIndices(total: number): number[] {
  const arr = Array.from({ length: total }, (_, i) => i);
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function pickRandomExcluding(total: number, excluded: Set<number>): number {
  const candidates: number[] = [];
  for (let i = 0; i < total; i++) {
    if (!excluded.has(i)) {
      candidates.push(i);
    }
  }
  if (candidates.length === 0) {
    return Math.floor(Math.random() * total);
  }
  return candidates[Math.floor(Math.random() * candidates.length)];
}

/**
 * Mobile (< 640px):
 * - Starts with a random video on every page load/refresh (never repeating the last refresh's opener).
 * - Whenever a video finishes, crossfades seamlessly to a random next video without repeating
 *   the video currently playing or the previous video(s).
 */
function MobileRandomPlayer() {
  const total = ALL_HERO_VIDEOS.length;

  const [initPair] = useState<[number, number]>(() => {
    let lastStart = -1;
    if (typeof window !== 'undefined') {
      try {
        const raw = sessionStorage.getItem(LAST_HERO_START_KEY);
        if (raw !== null) lastStart = Number(raw);
      } catch {
        // Ignore storage restrictions
      }
    }
    const first = pickRandomExcluding(total, lastStart >= 0 ? new Set([lastStart]) : new Set());
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.setItem(LAST_HERO_START_KEY, String(first));
      } catch {
        // Ignore storage restrictions
      }
    }
    const second = pickRandomExcluding(total, new Set([first, lastStart]));
    return [first, second];
  });

  const [activeSlot, setActiveSlot] = useState<0 | 1>(0);
  const [slotIndices, setSlotIndices] = useState<[number, number]>(initPair);
  const recentHistoryRef = useRef<number[]>([initPair[0]]);
  const videoRefs = useRef<[HTMLVideoElement | null, HTMLVideoElement | null]>([null, null]);

  const bindRef = useCallback(
    (slot: 0 | 1) => (el: HTMLVideoElement | null) => {
      videoRefs.current[slot] = el;
      if (el) {
        el.defaultMuted = true;
        el.muted = true;
        el.volume = 0;
      }
    },
    []
  );

  useEffect(() => {
    const current = videoRefs.current[activeSlot];
    if (current) {
      current.muted = true;
      current.play().catch(() => {});
    }

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        const el = videoRefs.current[activeSlot];
        if (el && el.paused) {
          el.muted = true;
          el.play().catch(() => {});
        }
      }
    };
