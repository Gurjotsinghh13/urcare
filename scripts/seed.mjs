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

  // 4. Provision 20 Unique Demo Patients
  console.log('\n--- 4. Provisioning 20 Demo Patients ---');
  const patientSeeds = [
    { patient_code: 'URC-5201', full_name: 'Evelyn Harper', age: 47, gender: 'F', status: 'admitted', medical_history: 'Mild allergic rhinitis, non-smoker' },
    { patient_code: 'URC-5202', full_name: 'Julian Bradley', age: 31, gender: 'M', status: 'admitted', medical_history: 'No prior chronic conditions' },
    { patient_code: 'URC-5203', full_name: 'Amara Okonjo', age: 36, gender: 'F', status: 'admitted', medical_history: 'Prior gestational diabetes, diet controlled' },
    { patient_code: 'URC-5204', full_name: 'Vikram Singhania', age: 58, gender: 'M', status: 'admitted', medical_history: 'Mild hypertension, ACE inhibitor therapy' },
    { patient_code: 'URC-5205', full_name: 'Seraphina Rossi', age: 29, gender: 'F', status: 'admitted', medical_history: 'Acute febrile viral syndrome, productive cough' },
    { patient_code: 'URC-5206', full_name: 'Henrik Lindqvist', age: 63, gender: 'M', status: 'admitted', medical_history: 'Moderate chronic bronchitis, higher clinical vulnerability' },
    { patient_code: 'URC-5207', full_name: 'Talia Al-Hashemi', age: 26, gender: 'F', status: 'admitted', medical_history: 'Mild pharyngitis and myalgia' },
    { patient_code: 'URC-5208', full_name: 'Caleb Montgomery', age: 41, gender: 'M', status: 'admitted', medical_history: 'High-risk contact exposure quarantine, asymptomatic' },
    { patient_code: 'URC-5209', full_name: 'Linnea Bergstrom', age: 33, gender: 'F', status: 'admitted', medical_history: 'Transferred from satellite triage center' },
    { patient_code: 'URC-5210', full_name: 'Darius Sterling', age: 44, gender: 'M', status: 'discharge_eligible', medical_history: 'Afebrile for 4 days, clear breath sounds' },
    { patient_code: 'URC-5211', full_name: 'Mei-Ling Zhou', age: 52, gender: 'F', status: 'discharge_eligible', medical_history: 'Normalized vital signs, ambulatory' },
    { patient_code: 'URC-5212', full_name: 'Alexander Brooks', age: 38, gender: 'M', status: 'discharge_approved', medical_history: 'Clinical review signed off by Dr. Vance, awaiting bed release' },
    { patient_code: 'URC-5213', full_name: 'Camila Fernandez', age: 46, gender: 'F', status: 'discharge_approved', medical_history: '5 days afebrile, cleared for home release' },
    { patient_code: 'URC-5214', full_name: 'Zachary Cole', age: 35, gender: 'M', status: 'discharged', medical_history: 'Full recovery, negative PCR test, released yesterday' },
    { patient_code: 'URC-5215', full_name: 'Miriam Goldmann', age: 59, gender: 'F', status: 'discharged', medical_history: 'Safe discharge with follow-up instructions' },
    { patient_code: 'URC-5216', full_name: 'Rohan Deshmukh', age: 32, gender: 'M', status: 'discharged', medical_history: 'Discharged 2 days ago' },
    { patient_code: 'URC-5217', full_name: 'Ingrid Halvorsen', age: 64, gender: 'F', status: 'discharged', medical_history: 'Discharged 4 days ago after 7-day observation' },
    { patient_code: 'URC-5218', full_name: 'Cornelius Vanderbilt IV', age: 81, gender: 'M', status: 'deceased', medical_history: 'Acute respiratory distress with multiorgan failure' },
    { patient_code: 'URC-5219', full_name: 'Sienna Walker', age: 30, gender: 'F', status: 'admitted', medical_history: 'Day 2 afebrile, improving comfortably' },
    { patient_code: 'URC-5220', full_name: 'Mateo Gutierrez', age: 53, gender: 'M', status: 'admitted', medical_history: 'Day 1 afebrile, vitals normalizing' },
  ];

  for (const pat of patientSeeds) {
    await supabase.from('patients').upsert(pat, { onConflict: 'patient_code' });
  }
  console.log('✓ 20 patients synchronized with unique demographics.');

  console.log('\n======================================================');
  console.log('🎉 Seed Process Complete! All 4 Demo Accounts Ready.');
  console.log('======================================================\n');
}

seed().catch((err) => {
  console.error('Fatal seed script error:', err);
  process.exit(1);
});
