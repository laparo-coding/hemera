// Auth-related TypeScript types for Clerk integration

import type { User } from "@clerk/nextjs/server";

export interface ClerkUser {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  imageUrl?: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

export enum UserRole {
  USER = "user",
  ADMIN = "admin",
}

export interface AuthState {
  isAuthenticated: boolean;
  user: ClerkUser | null;
  isLoading: boolean;
}

export interface NavigationPermission {
  route: string;
  label: string;
  allowedRoles: UserRole[];
  icon?: string;
}

export interface AuthError {
  code: string;
  message: string;
  details?: string;
}

// Extended Clerk User with role information
export interface ExtendedClerkUser extends User {
  publicMetadata: {
    role: UserRole;
  };
}

// Auth context types
export interface AuthContextValue {
  user: ClerkUser | null;
  role: UserRole | null;
  isAdmin: boolean;
  isAuthenticated: boolean;
}

// Route protection types
export interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: UserRole;
  fallback?: React.ReactNode;
}
