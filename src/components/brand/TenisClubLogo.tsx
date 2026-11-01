import React from 'react';
import { cn } from '@/lib/utils';

interface TenisClubLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'hero';
  showTagline?: boolean;
  tagline?: string;
  logoUrl?: string | null;
  className?: string;
}

export function TenisClubLogo({
  size = 'md',
  showTagline = false,
  tagline = '',
  logoUrl,
  className,
}: TenisClubLogoProps) {
  if (logoUrl) {
    return (
      <div className={cn('inline-flex flex-col items-center', className)}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={logoUrl}
          alt="Tênis Club"
          className={cn(
            'object-contain',
            size === 'sm' && 'h-8',
            size === 'md' && 'h-10',
            size === 'lg' && 'h-14',
            size === 'hero' && 'h-24 md:h-28'
          )}
        />
      </div>
    );
  }

  if (size === 'sm' || size === 'md') {
    return (
      <div className={cn('inline-flex items-center gap-2.5 select-none group', className)}>
        <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-[#16161B] border border-zinc-800 group-hover:border-[#BEFA46]/60 transition-colors">
          <svg
            viewBox="0 0 80 42"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-7 h-5 text-[#BEFA46]"
          >
            <path
              d="M8 31L39 11C42 9.2 45 10.5 47.5 14C49.5 16.8 53 17.5 57.5 14.5C60.5 12.5 63.5 13 65 16.5L72 31H8Z"
              stroke="currentColor"
              strokeWidth="4.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M6 36H74"
              stroke="white"
              strokeWidth="3.5"
              strokeLinecap="round"
            />
          </svg>
        </div>
        <div className="flex flex-col leading-none">
          <span
            className={cn(
              'font-black italic tracking-tight text-white uppercase',
              size === 'sm' ? 'text-lg' : 'text-xl'
            )}
          >
            TÊNIS
          </span>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="h-[1.5px] w-3 bg-[#BEFA46]" />
            <span className="text-[9px] font-extrabold tracking-[0.32em] text-zinc-200 uppercase">
              CLUB
            </span>
            <span className="h-[1.5px] w-3 bg-[#BEFA46]" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('inline-flex flex-col items-center select-none', className)}>
      {/* Iconic Sneaker Silhouette Arch matching TÊNIS CLUB identity */}
      <svg
        viewBox="0 0 220 68"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={cn(
          'text-white mb-1',
          size === 'lg' ? 'w-36 h-11' : 'w-48 md:w-60 h-14 md:h-16'
        )}
      >
        <path
          d="M28 56L114 14C120 11 125 13 130 21C135 28 144 30 154 22C160 17 166 18 170 26L186 56"
          stroke="currentColor"
          strokeWidth="6.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M54 55C88 45 128 45 174 55"
          stroke="#BEFA46"
          strokeWidth="4.5"
          strokeLinecap="round"
        />
      </svg>

      <span
        className={cn(
          'font-black italic tracking-tight text-white uppercase leading-[0.88]',
          size === 'lg' ? 'text-4xl' : 'text-5xl md:text-7xl'
        )}
      >
        TÊNIS
      </span>
// step 5/6
