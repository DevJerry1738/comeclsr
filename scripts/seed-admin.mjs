/**
 * seed-admin.mjs
 * Seeds admin@comeclsr.com into Supabase auth.users and user_profiles.
 * Run with: node scripts/seed-admin.mjs
 */

import { createClient } from '@supabase/supabase-js';
import ws from 'ws';

const SUPABASE_URL = 'https://uyuecdtiupucoixnpwbz.supabase.co';
const SERVICE_ROLE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV5dWVjZHRpdXB1Y29peG5wd2J6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Nzk3MjAyMiwiZXhwIjoyMDkzNTQ4MDIyfQ.qVPa_Alb_gkPLZSDdKtex2q-trfKhod9XQ4Yq7P2oLw';

// Service-role client bypasses RLS
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
  realtime: {
    transport: ws,   // required for Node < 22
  },
});

const ADMIN_EMAIL    = 'admin@comeclsr.com';
const ADMIN_PASSWORD = 'bigadmin234';

async function seedAdmin() {
  console.log('🔑 Seeding admin user...\n');

  // ── Step 1: Create auth.users record ──────────────────────────────────────
  console.log(`[1/3] Creating auth user: ${ADMIN_EMAIL}`);

  let userId;

  const { data: authData, error: authError } =
    await supabase.auth.admin.createUser({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      email_confirm: true,          // mark email as confirmed immediately
      user_metadata: {
        full_name: 'Platform Admin',
        role: 'admin',
      },
    });

  if (authError) {
    const msg = authError.message?.toLowerCase() ?? '';
    if (msg.includes('already been registered') || msg.includes('already exists')) {
      console.log('  ⚠️  Auth user already exists — fetching existing record.');

      const { data: listData, error: listError } =
        await supabase.auth.admin.listUsers();
      if (listError) throw listError;

      const existing = listData.users.find((u) => u.email === ADMIN_EMAIL);
      if (!existing) throw new Error('Could not locate existing admin auth user.');
      userId = existing.id;
      console.log(`  ✅ Found existing auth user: ${userId}`);
    } else {
      throw authError;
    }
  } else {
    userId = authData.user.id;
    console.log(`  ✅ Auth user created: ${userId}`);
  }

  // ── Step 2: Upsert user_profiles record ───────────────────────────────────
  console.log(`[2/3] Upserting user_profiles for ${ADMIN_EMAIL} (id: ${userId})`);

  const { error: profileError } = await supabase
    .from('user_profiles')
    .upsert(
      {
        id:                   userId,
        email:                ADMIN_EMAIL,
        full_name:            'Platform Admin',
        username:             'platform_admin',
        role:                 'admin',
        status:               'active',
        payment_status:       'approved',
        kyc_status:           'approved',
        conversation_status:  'active',
        created_at:           new Date().toISOString(),
        updated_at:           new Date().toISOString(),
        last_sign_in_at:      new Date().toISOString(),
      },
      { onConflict: 'id' }
    );

  if (profileError) throw profileError;
  console.log('  ✅ user_profiles record upserted.');

  // ── Step 3: Verify ────────────────────────────────────────────────────────
  console.log('[3/3] Verifying...');

  const { data: profile, error: verifyError } = await supabase
    .from('user_profiles')
    .select('id, email, role, status')
    .eq('id', userId)
    .single();

  if (verifyError) throw verifyError;

  console.log('\n✅ Admin seeded successfully!\n');
  console.table(profile);
  console.log('\n📋 Login credentials:');
  console.log(`   Email   : ${ADMIN_EMAIL}`);
  console.log(`   Password: ${ADMIN_PASSWORD}`);

  process.exit(0);
}

seedAdmin().catch((err) => {
  console.error('\n❌ Seeding failed:', err.message ?? err);
  process.exit(1);
});
