/**
 * Admin Users Page
 * Feature: 024-admin-dashboard
 *
 * User management page with paginated list, search, and Outperformer filter.
 * Client component wrapper for handling user interactions.
 */

'use client';

import { Alert, Box, CircularProgress } from '@mui/material';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { AdminPageContainer } from '@/components/admin/AdminPageContainer';
import { UserList } from '@/components/admin/UserList';
import { ADMIN_LABELS } from '@/lib/constants/admin';
import type {
  AdminUserListItem,
  AdminUsersQueryParams,
  PaginationMeta,
} from '@/lib/types/admin';

export default function UsersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Parse query params
  const page = Number(searchParams.get('page')) || 1;
  const search = searchParams.get('search') || '';
  const outperformerOnly = searchParams.get('outperformer') === 'true';
  const sortBy =
    (searchParams.get('sort') as
      | 'name'
      | 'email'
      | 'createdAt'
      | 'lastSignInAt') || 'createdAt';
  const sortOrder = (searchParams.get('order') as 'asc' | 'desc') || 'desc';

  const [users, setUsers] = useState<AdminUserListItem[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>({
    page: 1,
    limit: 10,
    totalItems: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: false,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const queryParams: AdminUsersQueryParams = {
    page,
    limit: 10,
    search,
    outperformerOnly,
    sortBy,
    sortOrder,
  };

  // Fetch users
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      params.set('page', page.toString());
      params.set('limit', '10');
      if (search) params.set('search', search);
      if (outperformerOnly) params.set('outperformerOnly', 'true');
      params.set('sortBy', sortBy);
      params.set('sortOrder', sortOrder);

      const response = await fetch(`/api/admin/users?${params.toString()}`);
      if (!response.ok) throw new Error('Fehler beim Laden der Benutzer');

      const data = await response.json();
      setUsers(data.data.users);
      setPagination(data.data.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unbekannter Fehler');
    } finally {
      setLoading(false);
    }
  }, [page, search, outperformerOnly, sortBy, sortOrder]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Update URL when query params change
  const handleQueryChange = useCallback(
    (params: AdminUsersQueryParams) => {
      const newParams = new URLSearchParams();
      if (params.page && params.page > 1)
        newParams.set('page', params.page.toString());
      if (params.search) newParams.set('search', params.search);
      if (params.outperformerOnly) newParams.set('outperformer', 'true');
      if (params.sortBy && params.sortBy !== 'createdAt')
        newParams.set('sort', params.sortBy);
      if (params.sortOrder && params.sortOrder !== 'desc')
        newParams.set('order', params.sortOrder);

      const queryString = newParams.toString();
      router.push(queryString ? `/admin/users?${queryString}` : '/admin/users');
    },
    [router]
  );

  const handleViewUser = useCallback((userId: string) => {
    // For now, just log - could navigate to user detail page
    // biome-ignore lint/suspicious/noConsole: Debug logging
    console.log('View user:', userId);
  }, []);

  const handleAssignRole = useCallback(
    async (userId: string) => {
      // Toggle admin role
      const user = users.find(u => u.id === userId);
      if (!user) return;

      try {
        const response = await fetch(`/api/admin/users/${userId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ role: user.isAdmin ? 'user' : 'admin' }),
        });

        if (!response.ok) throw new Error('Fehler beim Ändern der Rolle');
        fetchUsers();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unbekannter Fehler');
      }
    },
    [users, fetchUsers]
  );

  const handleDeleteUser = useCallback(
    async (userId: string) => {
      if (!confirm('Bist du sicher, dass du diesen Benutzer löschen möchtest?'))
        return;

      try {
        const response = await fetch(`/api/admin/users/${userId}`, {
          method: 'DELETE',
        });

        if (!response.ok) throw new Error('Fehler beim Löschen des Benutzers');
        fetchUsers();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unbekannter Fehler');
      }
    },
    [fetchUsers]
  );

  return (
    <AdminPageContainer
      title={ADMIN_LABELS.users}
      subtitle='Verwalte Benutzerkonten, Rollen und Berechtigungen.'
      breadcrumbs={[{ label: ADMIN_LABELS.users, href: '/admin/users' }]}
      titleProps={{ 'data-testid': 'admin-users-page' }}
    >
      {error && (
        <Alert severity='error' sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <UserList
          users={users}
          pagination={pagination}
          queryParams={queryParams}
          onQueryChange={handleQueryChange}
          onViewUser={handleViewUser}
          onAssignRole={handleAssignRole}
          onDeleteUser={handleDeleteUser}
        />
      )}
    </AdminPageContainer>
  );
}
