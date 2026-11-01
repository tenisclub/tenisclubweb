import { NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';
import { createServiceClient } from '@/lib/supabase/server';

const ALLOWED_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/avif',
  'image/svg+xml',
];
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export async function POST(request: Request) {
// step 1/5
