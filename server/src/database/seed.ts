import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import { db } from './db.js';
import { Role, AccountStatus } from '../common/types.js';

interface SeedUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  password: string;
  role: Role;
  status: AccountStatus;
  failedCount?: number;
  lockedUntil?: string | null;
}

export const SEED_USERS: SeedUser[] = [
  {
    id: '11111111-1111-4111-a111-111111111111',
    name: 'Dr. Sarah Smith (Cardiologist)',
    email: 'doctor.smith@goingmerry.com',
    phone: '+919876543210',
    password: 'Doctor@123',
    role: 'DOCTOR',
    status: 'ACTIVE',
  },
  {
    id: '22222222-2222-4222-a222-222222222222',
    name: 'John Doe (Patient)',
    email: 'patient.john@goingmerry.com',
    phone: '+919876543211',
    password: 'Patient@123',
    role: 'PATIENT',
    status: 'ACTIVE',
  },
  {
    id: '33333333-3333-4333-a333-333333333333',
    name: 'Emily Watson (Reception)',
    email: 'receptionist@goingmerry.com',
    phone: '+919876543212',
    password: 'Reception@123',
    role: 'RECEPTIONIST',
    status: 'ACTIVE',
  },
  {
    id: '44444444-4444-4444-a444-444444444444',
    name: 'David Patel (Lead Pharmacist)',
    email: 'pharmacist@goingmerry.com',
    phone: '+919876543213',
    password: 'Pharmacy@123',
    role: 'PHARMACIST',
    status: 'ACTIVE',
  },
  {
    id: '55555555-5555-4555-a555-555555555555',
    name: 'Alice Johnson (Hospital Admin)',
    email: 'admin@goingmerry.com',
    phone: '+919876543214',
    password: 'Admin@123',
    role: 'ADMIN',
    status: 'ACTIVE',
  },
  {
    id: '66666666-6666-4666-a666-666666666666',
    name: 'Florence Nightingale (Triage Nurse)',
    email: 'nurse.florence@goingmerry.com',
    phone: '+919876543218',
    password: 'Nurse@123',
    role: 'NURSE',
    status: 'ACTIVE',
  },
  {
    id: '77777777-7777-4777-a777-777777777777',
    name: 'Rajesh Kumar (Inventory Manager)',
    email: 'inventory@goingmerry.com',
    phone: '+919876543220',
    password: 'Inventory@123',
    role: 'INVENTORY_MANAGER',
    status: 'ACTIVE',
  },
  {
    id: '88888888-8888-4888-a888-888888888888',
    name: 'Suspended Account Example',
    email: 'suspended@goingmerry.com',
    phone: '+919876543215',
    password: 'Suspended@123',
    role: 'PATIENT',
    status: 'SUSPENDED',
  },
  {
    id: '99999999-9999-4999-a999-999999999999',
    name: 'Locked Account Example',
    email: 'locked@goingmerry.com',
    phone: '+919876543216',
    password: 'Locked@123',
    role: 'DOCTOR',
    status: 'LOCKED',
    failedCount: 5,
    lockedUntil: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
  },
  {
    id: 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa',
    name: 'Unverified Account Example',
    email: 'unverified@goingmerry.com',
    phone: '+919876543217',
    password: 'Unverified@123',
    role: 'PATIENT',
    status: 'PENDING_VERIFICATION',
  },
];

export async function seedDatabase() {
  console.log('🌱 Seeding Going Merry HMS database...');
  const now = new Date().toISOString();

  for (const user of SEED_USERS) {
    const existing = db.prepare('SELECT id FROM users WHERE id = ?').get(user.id);
    const passwordHash = await bcrypt.hash(user.password, 10);

    if (existing) {
      db.prepare(`
        UPDATE users 
        SET email = ?, phone = ?, password_hash = ?, name = ?, role = ?, status = ?, failed_login_count = ?, locked_until = ?, updated_at = ?
        WHERE id = ?
      `).run(
        user.email,
        user.phone,
        passwordHash,
        user.name,
        user.role,
        user.status,
        user.failedCount || 0,
        user.lockedUntil || null,
        now,
        user.id
      );
    } else {
      db.prepare(`
        INSERT INTO users (id, email, phone, password_hash, name, role, status, failed_login_count, locked_until, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        user.id,
        user.email,
        user.phone,
        passwordHash,
        user.name,
        user.role,
        user.status,
        user.failedCount || 0,
        user.lockedUntil || null,
        now,
        now
      );
    }
  }

  console.log(`✅ Seeded ${SEED_USERS.length} hospital accounts across all clinical roles.`);
}

// Execute if run directly
if (process.argv[1]?.endsWith('seed.ts') || process.argv[1]?.endsWith('seed.js')) {
  seedDatabase().catch((err) => {
    console.error('Failed to seed database:', err);
    process.exit(1);
  });
}
