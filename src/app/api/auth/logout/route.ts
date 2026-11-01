import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { getVerifiedClaims } from '@/lib/auth';
import { invalidateAuthCache } from '@/lib/server-cache';
import { createClient } from '@/lib/supabase/server';

export async function POST() {
  try {
// step 1/4
