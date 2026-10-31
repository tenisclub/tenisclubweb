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

const HERO_VIDEO_COLUMNS: [string, string][] = [
  ['/videos/hero-01.mp4', '/videos/hero-06.mp4'],
  ['/videos/hero-02.mp4?v=2', '/videos/hero-07.mp4'],
  ['/videos/hero-03.mp4?v=2', '/videos/hero-08.mp4'],
  ['/videos/hero-04.mp4?v=2', '/videos/hero-09.mp4'],
  ['/videos/hero-05.mp4', '/videos/hero-10.mp4'],
];

function MobileSequentialPlayer() {
  const [activeSlot, setActiveSlot] = useState<0 | 1>(0);
  const [slotIndices, setSlotIndices] = useState<[number, number]>([0, 1]);
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

    const nextSlot: 0 | 1 = finishedSlot === 0 ? 1 : 0;
    const nextVideoIdx = slotIndices[nextSlot];
    const upcomingIdx = (nextVideoIdx + 1) % ALL_HERO_VIDEOS.length;

    const nextEl = videoRefs.current[nextSlot];
    if (nextEl) {
      nextEl.muted = true;
      nextEl.currentTime = 0;
      nextEl.play().catch(() => {});
    }

    setActiveSlot(nextSlot);
    // Preload the video after next into the slot that just finished after crossfade completes
    setTimeout(() => {
      setSlotIndices((prev) =>
        finishedSlot === 0 ? [upcomingIdx, prev[1]] : [prev[0], upcomingIdx]
      );
    }, 650);
  };

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#09090C] opacity-65">
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
            preload="auto"
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

interface VideoColumnProps {
  sources: [string, string];
  className?: string;
}

function VideoColumn({ sources, className }: VideoColumnProps) {
  const [activeIdx, setActiveIdx] = useState<0 | 1>(0);
  const videoRefs = useRef<[HTMLVideoElement | null, HTMLVideoElement | null]>([null, null]);

  const setVideoRef = useCallback(
    (idx: 0 | 1) => (el: HTMLVideoElement | null) => {
      videoRefs.current[idx] = el;
      if (el) {
        el.defaultMuted = true;
        el.muted = true;
        el.volume = 0;
      }
    },
    []
  );

  useEffect(() => {
    const first = videoRefs.current[0];
    if (first) {
      first.muted = true;
      first.play().catch(() => {});
    }

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        const current = videoRefs.current[activeIdx];
        if (current && current.paused) {
          current.muted = true;
          current.play().catch(() => {});
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [activeIdx]);

  const handleEnded = (idx: 0 | 1) => {
    const nextIdx: 0 | 1 = idx === 0 ? 1 : 0;
    const nextVideo = videoRefs.current[nextIdx];
    if (nextVideo) {
      nextVideo.muted = true;
      nextVideo.currentTime = 0;
      nextVideo.play().catch(() => {});
      setActiveIdx(nextIdx);
    } else {
      const sameVideo = videoRefs.current[idx];
      if (sameVideo) {
        sameVideo.currentTime = 0;
        sameVideo.play().catch(() => {});
      }
    }
  };

  return (
    <div className={cn('relative h-full w-full overflow-hidden bg-[#09090C]', className)}>
      {sources.map((src, i) => {
        const idx = i as 0 | 1;
        const isActive = activeIdx === idx;
        return (
          <video
            key={src}
            ref={setVideoRef(idx)}
            src={src}
            muted
            playsInline
            autoPlay={idx === 0}
            preload={idx === 0 ? 'auto' : 'metadata'}
            onEnded={() => handleEnded(idx)}
            aria-hidden="true"
            tabIndex={-1}
            className={cn(
              'absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ease-in-out',
              isActive ? 'opacity-100' : 'opacity-0'
            )}
          />
        );
      })}
    </div>
  );
}

export function HeroVideoBackground() {
  const [viewportMode, setViewportMode] = useState<'ssr' | 'mobile' | 'desktop'>('ssr');

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 639px)');
    const apply = () => setViewportMode(mq.matches ? 'mobile' : 'desktop');
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, []);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 select-none overflow-hidden bg-[#070709]"
    >
      {viewportMode === 'mobile' && <MobileSequentialPlayer />}

      {viewportMode === 'desktop' && (
        <div className="grid h-full w-full grid-cols-4 lg:grid-cols-5 gap-2 opacity-55">
          {HERO_VIDEO_COLUMNS.map((pair, index) => (
            <VideoColumn
              key={pair[0]}
              sources={pair}
              className={cn(index === 4 && 'hidden lg:block')}
            />
          ))}
        </div>
      )}

      {/* Contrast vignette & edge fades so logo and typography remain razor-sharp */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(7,7,9,0.68)_0%,rgba(7,7,9,0.34)_55%,rgba(7,7,9,0.70)_100%)]" />
      <div className="absolute inset-0 bg-gradient-to-b from-[#070709]/65 via-transparent to-[#0A0A0D]" />
    </div>
  );
}
