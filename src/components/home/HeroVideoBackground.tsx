'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

const HERO_VIDEO_COLUMNS: [string, string][] = [
  ['/videos/hero-01.mp4', '/videos/hero-06.mp4'],
  ['/videos/hero-02.mp4?v=2', '/videos/hero-07.mp4'],
  ['/videos/hero-03.mp4?v=2', '/videos/hero-08.mp4'],
  ['/videos/hero-04.mp4?v=2', '/videos/hero-09.mp4'],
  ['/videos/hero-05.mp4', '/videos/hero-10.mp4'],
];

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
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 select-none overflow-hidden bg-[#070709]"
    >
      {/* Multi-column silent sneaker video wall */}
      <div className="grid h-full w-full grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-1.5 sm:gap-2 opacity-55">
        {HERO_VIDEO_COLUMNS.map((pair, index) => (
          <VideoColumn
            key={pair[0]}
            sources={pair}
            className={cn(
              index === 3 && 'hidden sm:block',
              index === 4 && 'hidden lg:block'
            )}
          />
        ))}
      </div>

      {/* Contrast vignette & edge fades so logo and typography remain razor-sharp */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(7,7,9,0.72)_0%,rgba(7,7,9,0.38)_55%,rgba(7,7,9,0.72)_100%)]" />
      <div className="absolute inset-0 bg-gradient-to-b from-[#070709]/70 via-transparent to-[#0A0A0D]" />
    </div>
  );
}

