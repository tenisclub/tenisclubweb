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
// step 2/6
