import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://tenisclub.vercel.app';
  return {
    rules: [
      {
        userAgent: '*',
// step 2/4
