export type Role =
  | 'PATIENT'
  | 'RECEPTIONIST'
  | 'DOCTOR'
  | 'NURSE'
  | 'PHARMACIST'
  | 'LAB_TECH'
  | 'RADIOLOGIST'
  | 'INVENTORY_MANAGER'
  | 'BILLING_STAFF'
  | 'ADMIN'
  | 'MANAGEMENT'
  | 'SUPER_ADMIN';

export type AccountStatus = 'ACTIVE' | 'SUSPENDED' | 'LOCKED' | 'PENDING_VERIFICATION';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: Role;
  status: AccountStatus;
  lastLoginAt?: string | null;
}

export interface DemoUser extends User {
  failedLoginCount?: number;
  lockedUntil?: string | null;
  defaultPassword?: string;
  notes?: string;
}

export interface AuthSession {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface SecurityEvent {
  id: string;
  user_id: string | null;
  event_type: string;
  identifier: string;
  ip_address: string | null;
  user_agent?: string | null;
  metadata: string | null;
  created_at: string;
}

export interface AuditLog {
  id: string;
  actor_id: string | null;
  actor_role: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  changes: string | null;
  timestamp: string;
}
