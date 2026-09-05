import React from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { Role } from '../../types/auth.js';

interface RequireRoleProps {
  roles: Role[];
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * Role-gated UI component wrapper per PRD A.4.11
 */
export const RequireRole: React.FC<RequireRoleProps> = ({
  roles,
  fallback = null,
  children,
}) => {
  const { user } = useAuth();

  if (!user || !roles.includes(user.role)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};
