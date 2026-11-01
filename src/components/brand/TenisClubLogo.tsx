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
// step 1/6
