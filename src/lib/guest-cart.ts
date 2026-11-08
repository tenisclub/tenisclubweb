import { cookies } from 'next/headers';
import type { NextResponse } from 'next/server';

export const GUEST_CART_COOKIE = 'tc_guest_id';
export const GUEST_CART_FLAG_COOKIE = 'tc_guest_cart';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const THIRTY_DAYS_SECONDS = 60 * 60 * 24 * 30;

export function isValidUuid(value: unknown): value is string {
  return typeof value === 'string' && UUID_RE.test(value.trim());
}

export async function readGuestCartId(): Promise<string | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(GUEST_CART_COOKIE)?.value?.trim();
  return isValidUuid(raw) ? raw : null;
}

export function attachGuestCartCookies(res: NextResponse, guestId: string): void {
  const isProd = process.env.NODE_ENV === 'production';
  res.cookies.set(GUEST_CART_COOKIE, guestId, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    secure: isProd,
    maxAge: THIRTY_DAYS_SECONDS,
  });
  res.cookies.set(GUEST_CART_FLAG_COOKIE, '1', {
    httpOnly: false,
    sameSite: 'lax',
    path: '/',
    secure: isProd,
    maxAge: THIRTY_DAYS_SECONDS,
  });
}

export function clearGuestCartFlagCookie(res: NextResponse): void {
  const isProd = process.env.NODE_ENV === 'production';
  res.cookies.set(GUEST_CART_FLAG_COOKIE, '', {
    httpOnly: false,
    sameSite: 'lax',
    path: '/',
    secure: isProd,
    maxAge: 0,
  });
}

export function clearGuestCartCookies(res: NextResponse): void {
  const isProd = process.env.NODE_ENV === 'production';
  res.cookies.set(GUEST_CART_COOKIE, '', {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    secure: isProd,
    maxAge: 0,
  });
  clearGuestCartFlagCookie(res);
}
