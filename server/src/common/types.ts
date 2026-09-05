export const ROLES = [
  'PATIENT',
  'RECEPTIONIST',
  'DOCTOR',
  'NURSE',
  'PHARMACIST',
  'LAB_TECH',
  'RADIOLOGIST',
  'INVENTORY_MANAGER',
  'BILLING_STAFF',
  'ADMIN',
  'MANAGEMENT',
  'SUPER_ADMIN'
] as const;

export type Role = typeof ROLES[number];

export const ACCOUNT_STATUSES = [
  'ACTIVE',
  'SUSPENDED',
  'LOCKED',
  'PENDING_VERIFICATION'
] as const;

export type AccountStatus = typeof ACCOUNT_STATUSES[number];

export interface User {
  id: string;
  email: string;
  phone: string;
  password_hash: string;
  name: string;
  role: Role;
  status: AccountStatus;
  failed_login_count: number;
  locked_until: string | null;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserPublicProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: Role;
  status: AccountStatus;
  lastLoginAt: string | null;
}

export interface RefreshTokenRecord {
  id: string;
  user_id: string;
  token_hash: string;
  family_id: string;
  expires_at: string;
  revoked_at: string | null;
  created_at: string;
}

export interface SecurityEventRecord {
  id: string;
  user_id: string | null;
  event_type: string;
  identifier: string;
  ip_address: string | null;
  user_agent: string | null;
  metadata: string | null;
  created_at: string;
}

export interface AuditLogRecord {
  id: string;
  actor_id: string | null;
  actor_role: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  changes: string | null;
  timestamp: string;
}

export interface ApiResponse<T> {
  success: true;
  data: T;
  meta: {
    timestamp: string;
    [key: string]: any;
  };
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details: Record<string, any>;
  };
}

export interface JwtUserPayload {
  sub: string;
  role: Role;
  name: string;
  email: string;
  phone: string;
  status: AccountStatus;
}
