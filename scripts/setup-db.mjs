import fs from 'node:fs';
import path from 'node:path';
import pg from 'pg';
import { createClient } from '@supabase/supabase-js';

// Load .env.local if present
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    let val = trimmed.slice(eqIdx + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = val;
  }
}

const connectionString = process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!connectionString || !supabaseUrl || !serviceRoleKey) {
  console.error('Missing required environment variables (.env.local).');
  process.exit(1);
}

// Allow self-signed cert chain from Supabase pooler on Windows Node
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const client = new pg.Client({
  connectionString,
  ssl: { rejectUnauthorized: false },
});

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function run() {
  console.log('1. Connecting to Supabase PostgreSQL...');
  await client.connect();

  console.log('2. Applying supabase/schema.sql...');
  const schemaSql = fs.readFileSync(path.resolve(process.cwd(), 'supabase/schema.sql'), 'utf8');
  await client.query(schemaSql);
  console.log('   Schema, triggers, RLS policies & RPCs created!');

  if (process.argv.includes('--schema-only')) {
    const { rows } = await client.query('SELECT count(*)::int AS total FROM public.financial_entries');
    console.log(`   Financial entries synced: ${rows[0]?.total ?? 0}`);
    await client.end();
    return;
  }

  console.log('3. Configuring Supabase Storage buckets...');
  for (const bucketName of ['products', 'store']) {
    const { data: existing } = await supabase.storage.getBucket(bucketName);
    if (!existing) {
      const { error } = await supabase.storage.createBucket(bucketName, {
        public: true,
        fileSizeLimit: 5 * 1024 * 1024,
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/svg+xml'],
      });
      if (error) console.warn(`   Bucket ${bucketName} warning:`, error.message);
      else console.log(`   Created public bucket: ${bucketName}`);
    } else {
      console.log(`   Bucket ${bucketName} already exists.`);
    }
  }

  // Storage RLS policies for authenticated admin uploads & public read
  await client.query(`
    DO $$
    BEGIN
      DROP POLICY IF EXISTS "storage_public_read" ON storage.objects;
      DROP POLICY IF EXISTS "storage_admin_insert" ON storage.objects;
      DROP POLICY IF EXISTS "storage_admin_update" ON storage.objects;
      DROP POLICY IF EXISTS "storage_admin_delete" ON storage.objects;

      CREATE POLICY "storage_public_read" ON storage.objects
        FOR SELECT USING (bucket_id IN ('products', 'store'));

      CREATE POLICY "storage_admin_insert" ON storage.objects
        FOR INSERT WITH CHECK (bucket_id IN ('products', 'store') AND public.is_admin());

      CREATE POLICY "storage_admin_update" ON storage.objects
        FOR UPDATE USING (bucket_id IN ('products', 'store') AND public.is_admin());

      CREATE POLICY "storage_admin_delete" ON storage.objects
        FOR DELETE USING (bucket_id IN ('products', 'store') AND public.is_admin());
    END $$;
  `);

  console.log('4. Seeding RBAC Roles, Permissions & Store Settings...');
  await client.query(`
    INSERT INTO public.roles (name, label, description) VALUES
      ('customer', 'Cliente', 'Acesso à loja, carrinho, favoritos e pedidos próprios'),
      ('admin_operational', 'Administrador Operacional', 'Gerencia produtos, categorias, marcas, estoque e pedidos'),
// etapa 1/6
