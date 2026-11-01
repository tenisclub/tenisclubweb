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

    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [activeSlot]);

  const handleEnded = (finishedSlot: 0 | 1) => {
    if (finishedSlot !== activeSlot) return;

    const finishedVideoIdx = slotIndices[finishedSlot];
    const nextSlot: 0 | 1 = finishedSlot === 0 ? 1 : 0;
    const nowPlayingIdx = slotIndices[nextSlot];

    // Keep last 3 played indices so random picks feel varied and never repeat previous/current
    const updatedRecent = [...recentHistoryRef.current, nowPlayingIdx].slice(-4);
    recentHistoryRef.current = updatedRecent;

    const excluded = new Set<number>([
      nowPlayingIdx,
      finishedVideoIdx,
      ...updatedRecent,
    ]);
    // Fallback to strict (current + previous) if excluded grew too large
    const upcomingIdx =
      excluded.size < total
        ? pickRandomExcluding(total, excluded)
        : pickRandomExcluding(total, new Set([nowPlayingIdx, finishedVideoIdx]));

    const nextEl = videoRefs.current[nextSlot];
    if (nextEl) {
      nextEl.muted = true;
      nextEl.currentTime = 0;
      nextEl.play().catch(() => {});
    }

    setActiveSlot(nextSlot);

    // Preload the newly chosen random video into the inactive slot after crossfade finishes
    setTimeout(() => {
      setSlotIndices((prev) =>
        finishedSlot === 0 ? [upcomingIdx, prev[1]] : [prev[0], upcomingIdx]
      );
    }, 650);
  };

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#09090C] opacity-95">
      {([0, 1] as const).map((slot) => {
        const isActive = activeSlot === slot;
        const src = ALL_HERO_VIDEOS[slotIndices[slot]];
        return (
          <video
            key={slot}
            ref={bindRef(slot)}
            src={src}
            muted
            playsInline
            autoPlay={isActive}
            preload={isActive ? 'auto' : 'metadata'}
            onEnded={() => handleEnded(slot)}
            aria-hidden="true"
            tabIndex={-1}
            className={cn(
              'absolute inset-0 h-full w-full object-cover object-center transition-opacity duration-600 ease-in-out',
              isActive ? 'opacity-100' : 'opacity-0'
            )}
          />
        );
      })}
    </div>
  );
}

interface ColumnSlotState {
  activeSlot: 0 | 1;
  slots: [number, number];
}

/**
 * Desktop / Tablet (>= 640px):
 * - Coordinates 5 columns simultaneously from the 10-video pool.
 * - Every page refresh shuffles all 10 videos (guaranteed different opener permutation).
 * - Whenever any column's video finishes, it crossfades to its preloaded random video and
 *   queues a new random video that is NEITHER its previous video NOR any video currently playing
 *   in ANY column on screen.
 */
function DesktopRandomWall() {
  const total = ALL_HERO_VIDEOS.length;
  const colCount = 5;

  const [columns, setColumns] = useState<ColumnSlotState[]>(() => {
    let prevSignature = '';
    if (typeof window !== 'undefined') {
      try {
        prevSignature = sessionStorage.getItem(LAST_HERO_START_KEY) || '';
      } catch {
        // Ignore
      }
    }

    let deck = shuffleIndices(total);
    if (deck.slice(0, colCount).join(',') === prevSignature) {
      deck = shuffleIndices(total);
    }

    if (typeof window !== 'undefined') {
      try {
        sessionStorage.setItem(LAST_HERO_START_KEY, deck.slice(0, colCount).join(','));
      } catch {
        // Ignore
      }
    }

    return Array.from({ length: colCount }, (_, c) => ({
      activeSlot: 0,
      slots: [deck[c], deck[c + colCount]] as [number, number],
    }));
  });

  const columnsRef = useRef<ColumnSlotState[]>(columns);
  columnsRef.current = columns;

  const videoRefs = useRef<(HTMLVideoElement | null)[][]>(
    Array.from({ length: colCount }, () => [null, null])
  );

  const bindVideoRef = useCallback(
    (colIdx: number, slot: 0 | 1) => (el: HTMLVideoElement | null) => {
      videoRefs.current[colIdx][slot] = el;
      if (el) {
        el.defaultMuted = true;
        el.muted = true;
        el.volume = 0;
      }
    },
    []
  );

  useEffect(() => {
    for (let c = 0; c < colCount; c++) {
      const active = columnsRef.current[c].activeSlot;
      const el = videoRefs.current[c][active];
      if (el) {
        el.muted = true;
        el.play().catch(() => {});
      }
    }

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        for (let c = 0; c < colCount; c++) {
          const active = columnsRef.current[c].activeSlot;
          const el = videoRefs.current[c][active];
          if (el && el.paused) {
            el.muted = true;
            el.play().catch(() => {});
          }
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  const handleColumnEnded = (colIdx: number, finishedSlot: 0 | 1) => {
    const snapshot = columnsRef.current;
    const currentCol = snapshot[colIdx];
    if (!currentCol || currentCol.activeSlot !== finishedSlot) return;

    const finishedVid = currentCol.slots[finishedSlot];
    const nextSlot: 0 | 1 = finishedSlot === 0 ? 1 : 0;
    const incomingVid = currentCol.slots[nextSlot];

    // Start playing the preloaded slot immediately
    const nextEl = videoRefs.current[colIdx][nextSlot];
    if (nextEl) {
      nextEl.muted = true;
      nextEl.currentTime = 0;
      nextEl.play().catch(() => {});
    }

    // Build set of ALL videos that will be playing on screen right now
    const nowPlaying = new Set<number>();
    for (let c = 0; c < colCount; c++) {
      if (c === colIdx) {
        nowPlaying.add(incomingVid);
      } else {
        nowPlaying.add(snapshot[c].slots[snapshot[c].activeSlot]);
      }
    }

    // If any OTHER column had `incomingVid` sitting in its inactive buffer, swap that inactive buffer immediately so it never collides later
    const nextColumns = snapshot.map((col, c): ColumnSlotState => {
      if (c === colIdx) {
        return {
          activeSlot: nextSlot,
          slots: col.slots,
        };
      }
      const inactive: 0 | 1 = col.activeSlot === 0 ? 1 : 0;
      if (col.slots[inactive] === incomingVid) {
        const replacement = pickRandomExcluding(
          total,
          new Set([...nowPlaying, col.slots[col.activeSlot]])
        );
        const updatedSlots: [number, number] =
          inactive === 0 ? [replacement, col.slots[1]] : [col.slots[0], replacement];
        return { ...col, slots: updatedSlots };
      }
      return col;
    });

    columnsRef.current = nextColumns;
    setColumns(nextColumns);
