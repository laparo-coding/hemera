// Server-side auth utilities for Clerk
import { currentUser, type User } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

/**
 * Require authentication on the server side
 */
export async function requireAuth(): Promise<User> {
  const user = await currentUser();

  if (!user) {
    redirect('/sign-in');
  }

  return user;
}

/**
 * Check if user has admin role
 */
export async function isAdmin(): Promise<boolean> {
  const user = await currentUser();
  return (user?.publicMetadata?.role as string) === 'admin';
}

/**
 * Require admin role
 */
export async function requireAdmin(): Promise<User> {
  const user = await requireAuth();

  if ((user.publicMetadata?.role as string) !== 'admin') {
    redirect('/sign-in');
  }

  return user;
}

/**
 * Get current user
 */
export async function getCurrentUser(): Promise<User | null> {
  return await currentUser();
}
