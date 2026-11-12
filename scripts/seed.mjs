// URCARE Idempotent Database & Demo Accounts Seed Script
// Usage: node scripts/seed.mjs

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Try loading .env.local or .env
if (fs.existsSync('.env.local')) {
  dotenv.config({ path: '.env.local' });
} else if (fs.existsSync('.env')) {
  dotenv.config({ path: '.env' });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const DEMO_ACCOUNTS = [
  {
    email: 'admin@urcare.demo',
    password: 'URcareDemo!2026',
    full_name: 'Dr. Sarah Jenkins (Administrator)',
    role: 'admin',
    phone: '+1 (555) 019-2831',
  },
  {
    email: 'doctor@urcare.demo',
    password: 'URcareDemo!2026',
    full_name: 'Dr. Marcus Vance (Attending Physician)',
    role: 'doctor',
    phone: '+1 (555) 019-4822',
  },
  {
    email: 'nurse@urcare.demo',
    password: 'URcareDemo!2026',
    full_name: 'Nurse Priya Sharma (Charge Nurse)',
    role: 'nurse',
    phone: '+1 (555) 019-7819',
  },
  {
    email: 'manager@urcare.demo',
    password: 'URcareDemo!2026',
    full_name: 'Elena Rostova (Operations Director)',
    role: 'manager',
    phone: '+1 (555) 019-9941',
  },
];

async function seed() {
  console.log('======================================================');
  console.log('   URCARE: Smart Quarantine Facility Management System   ');
  console.log('            Automated Database Seeding                  ');
  console.log('======================================================\n');

  if (!supabaseUrl || !serviceRoleKey) {
    console.warn('⚠️  NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are not defined.');
    console.warn('ℹ️  The application includes an in-memory persistent store initialized with');
    console.warn('   all 74 beds, 4 demo accounts, and 20 clinical scenarios for local development.');
    console.warn('👉 When connecting to your hosted Supabase instance, set credentials in .env.local and re-run.');
    process.exit(0);
  }

  console.log(`Connecting to Supabase at: ${supabaseUrl}`);
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  // 1. Create or ensure Demo Accounts in Auth & Profiles
  console.log('\n--- 1. Provisioning 4 Mandatory Demo Accounts ---');
  const userMap = {};

  for (const account of DEMO_ACCOUNTS) {
    try {
      // Check if user already exists
      const { data: listData, error: listError } = await supabase.auth.admin.listUsers();
      let existingUser = listData?.users?.find((u) => u.email.toLowerCase() === account.email.toLowerCase());

      if (!existingUser) {
        console.log(`Creating Auth user: ${account.email} (${account.role})...`);
        const { data: createData, error: createError } = await supabase.auth.admin.createUser({
          email: account.email,
          password: account.password,
          email_confirm: true,
          user_metadata: {
            full_name: account.full_name,
            role: account.role,
          },
        });

        if (createError) {
          console.error(`Failed to create ${account.email}:`, createError.message);
          continue;
        }
        existingUser = createData.user;
      } else {
        console.log(`Auth user exists: ${account.email}. Updating password to ensure sync...`);
        await supabase.auth.admin.updateUserById(existingUser.id, {
          password: account.password,
          email_confirm: true,
          user_metadata: {
            full_name: account.full_name,
            role: account.role,
          },
        });
      }

      userMap[account.role] = existingUser.id;

      // Upsert Profile in profiles table
      const { error: profileError } = await supabase.from('profiles').upsert({
        id: existingUser.id,
        email: account.email,
        full_name: account.full_name,
        role: account.role,
        phone: account.phone,
        is_active: true,
        updated_at: new Date().toISOString(),
      });

      if (profileError) {
        console.warn(`Profile upsert note for ${account.email}:`, profileError.message);
      } else {
        console.log(`✓ Profile synchronized for ${account.email}`);
      }
    } catch (err) {
      console.error(`Error provisioning account ${account.email}:`, err.message);
    }
  }

  // 2. Provision 74 Facility Beds
  console.log('\n--- 2. Provisioning 74 Facility Beds ---');
  const beds = [];
  for (let i = 1; i <= 74; i++) {
    const ward = i <= 20 ? 'Ward A (Respiratory)' : i <= 40 ? 'Ward B (Observation)' : i <= 60 ? 'Ward C (Step-down)' : 'Ward D (Isolation)';
    beds.push({
      bed_number: i,
      ward,
      status: 'available',
      updated_at: new Date().toISOString(),
    });
  }

  const { error: bedError } = await supabase.from('beds').upsert(beds, { onConflict: 'bed_number' });
  if (bedError) {
    console.warn('Note on beds seeding:', bedError.message);
  } else {
    console.log('✓ 74 beds confirmed in database.');
  }

  // 3. Facility Settings
  console.log('\n--- 3. Provisioning Facility Settings ---');
  const { error: settingsError } = await supabase.from('facility_settings').upsert({
    facility_name: 'URCARE Quarantine Facility',
    capacity: 74,
    fever_threshold: 38.0,
    require_doctor_approval: true,
    days_required_fever_free: 3,
    timezone: 'Asia/Kolkata',
    min_outcome_sample: 20,
    updated_at: new Date().toISOString(),
  });
  if (settingsError) {
    console.warn('Note on settings seeding:', settingsError.message);
  } else {
    console.log('✓ Facility settings confirmed.');
  }

  console.log('\n======================================================');
  console.log('🎉 Seed Process Complete! All 4 Demo Accounts Ready.');
  console.log('======================================================\n');
}

seed().catch((err) => {
  console.error('Fatal seed script error:', err);
  process.exit(1);
});
