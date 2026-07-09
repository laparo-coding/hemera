'use client';

/**
 * UserList Component
 * Feature: 024-admin-dashboard
 *
 * Displays paginated list of users with search, filter, and action capabilities.
 */

import DeleteIcon from '@mui/icons-material/Delete';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import PersonIcon from '@mui/icons-material/Person';
import SecurityIcon from '@mui/icons-material/Security';
import StarIcon from '@mui/icons-material/Star';
import VisibilityIcon from '@mui/icons-material/Visibility';
import {
  Avatar,
  Box,
  Checkbox,
  Chip,
  FormControlLabel,
  IconButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Pagination,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { useCallback, useState } from 'react';
import { ADMIN_LABELS } from '@/lib/constants/admin';
import type {
  AdminUserListItem,
  AdminUsersQueryParams,
  PaginationMeta,
} from '@/lib/types/admin';

interface UserListProps {
  /** List of users to display */
  users: AdminUserListItem[];
  /** Pagination metadata */
  pagination: PaginationMeta;
  /** Current query parameters */
  queryParams: AdminUsersQueryParams;
  /** Callback when query params change */
  onQueryChange: (params: AdminUsersQueryParams) => void;
  /** Callback to view user details */
  onViewUser: (userId: string) => void;
  /** Callback to assign role */
  onAssignRole: (userId: string) => void;
  /** Callback to delete user */
  onDeleteUser: (userId: string) => void;
  /** Loading state */
  isLoading?: boolean;
}

export function UserList({
  users,
  pagination,
  queryParams,
  onQueryChange,
  onViewUser,
  onAssignRole,
  onDeleteUser,
  isLoading = false,
}: UserListProps) {
  const [searchValue, setSearchValue] = useState(queryParams.search || '');
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const handleSearchSubmit = useCallback(
    (event: React.FormEvent) => {
      event.preventDefault();
      onQueryChange({ ...queryParams, search: searchValue, page: 1 });
    },
    [queryParams, searchValue, onQueryChange]
  );

  const handleOutperformerFilterChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      onQueryChange({
        ...queryParams,
        outperformerOnly: event.target.checked,
        page: 1,
      });
    },
    [queryParams, onQueryChange]
  );

  const handlePageChange = useCallback(
    (_: React.ChangeEvent<unknown>, page: number) => {
      onQueryChange({ ...queryParams, page });
    },
    [queryParams, onQueryChange]
  );

  const handleMenuOpen = useCallback(
    (event: React.MouseEvent<HTMLElement>, userId: string) => {
      setAnchorEl(event.currentTarget);
      setSelectedUserId(userId);
    },
    []
  );

  const handleMenuClose = useCallback(() => {
    setAnchorEl(null);
    setSelectedUserId(null);
  }, []);

  const handleAction = useCallback(
    (action: 'view' | 'role' | 'delete') => {
      if (!selectedUserId) return;
      handleMenuClose();

      switch (action) {
        case 'view':
          onViewUser(selectedUserId);
          break;
        case 'role':
          onAssignRole(selectedUserId);
          break;
        case 'delete':
          onDeleteUser(selectedUserId);
          break;
      }
    },
    [selectedUserId, handleMenuClose, onViewUser, onAssignRole, onDeleteUser]
  );

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  return (
    <Paper
      sx={{ width: '100%', overflow: 'hidden', bgcolor: 'background.paper' }}
    >
      {/* Filters and Search */}
      <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Box
          sx={{
            display: 'flex',
            gap: 2,
            flexWrap: 'wrap',
            alignItems: 'center',
          }}
        >
          {/* Search */}
          <Box
            component='form'
            onSubmit={handleSearchSubmit}
            sx={{ flex: 1, minWidth: 200 }}
          >
            <TextField
              data-testid='user-search-input'
              placeholder='Suchen...'
              size='small'
              fullWidth
              value={searchValue}
              onChange={e => {
                setSearchValue(e.target.value);
              }}
              disabled={isLoading}
            />
          </Box>

          {/* Outperformer Filter */}
          <FormControlLabel
            data-testid='outperformer-filter'
            control={
              <Checkbox
                checked={queryParams.outperformerOnly || false}
                onChange={handleOutperformerFilterChange}
                disabled={isLoading}
              />
            }
            label={ADMIN_LABELS.outperformerOnly}
          />
        </Box>
      </Box>

      {/* Table */}
      <TableContainer>
        <Table>
          <TableHead data-testid='user-list-header'>
            <TableRow sx={{ bgcolor: 'background.paper' }}>
              <TableCell>{ADMIN_LABELS.name}</TableCell>
              <TableCell>{ADMIN_LABELS.email}</TableCell>
              <TableCell>{ADMIN_LABELS.role}</TableCell>
              <TableCell>{ADMIN_LABELS.outperformer}</TableCell>
              <TableCell>{ADMIN_LABELS.lastSignIn}</TableCell>
              <TableCell align='right'>{ADMIN_LABELS.actions}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align='center'>
                  <Typography color='text.secondary' sx={{ py: 4 }}>
                    Keine Benutzer gefunden
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              users.map(user => (
                <TableRow
                  key={user.id}
                  data-testid={`user-row-${user.id}`}
                  hover
                >
                  <TableCell>
                    <Box
                      sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}
                    >
                      <Avatar
                        src={user.imageUrl || undefined}
                        alt={user.fullName || user.email}
                        sx={{ width: 32, height: 32 }}
                      >
                        {(
                          user.firstName?.[0] ??
                          user.email[0] ??
                          'U'
                        ).toUpperCase()}
                      </Avatar>
                      <Typography variant='body2'>
                        {user.fullName || '-'}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant='body2'>{user.email}</Typography>
                  </TableCell>
                  <TableCell>
                    {user.isAdmin ? (
                      <Chip
                        icon={<SecurityIcon />}
                        label={ADMIN_LABELS.admin}
                        size='small'
                        color='primary'
                      />
                    ) : (
                      <Chip
                        icon={<PersonIcon />}
                        label={ADMIN_LABELS.user}
                        size='small'
                        variant='outlined'
                      />
                    )}
                  </TableCell>
                  <TableCell>
                    {user.isOutperformer && (
                      <Chip
                        data-testid='outperformer-badge'
                        icon={<StarIcon />}
                        label={ADMIN_LABELS.outperformer}
                        size='small'
                        color='success'
                      />
                    )}
                  </TableCell>
                  <TableCell>{formatDate(user.lastSignInAt)}</TableCell>
                  <TableCell align='right'>
                    <IconButton
                      data-testid='action-menu-button'
                      size='small'
                      onClick={e => {
                        handleMenuOpen(e, user.id);
                      }}
                    >
                      <MoreVertIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <Box
          data-testid='user-list-pagination'
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            p: 2,
            borderTop: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Typography variant='body2' color='text.secondary'>
            Seite {pagination.page} von {pagination.totalPages}
          </Typography>
          <Pagination
            count={pagination.totalPages}
            page={pagination.page}
            onChange={handlePageChange}
            disabled={isLoading}
          />
        </Box>
      )}

      {/* Action Menu */}
      <Menu
        data-testid='user-action-menu'
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem
          onClick={() => {
            handleAction('view');
          }}
        >
          <ListItemIcon>
            <VisibilityIcon fontSize='small' />
          </ListItemIcon>
          <ListItemText>Anzeigen</ListItemText>
        </MenuItem>
        <MenuItem
          data-testid='assign-role-action'
          onClick={() => {
            handleAction('role');
          }}
        >
          <ListItemIcon>
            <SecurityIcon fontSize='small' />
          </ListItemIcon>
          <ListItemText>{ADMIN_LABELS.assignRole}</ListItemText>
        </MenuItem>
        <MenuItem
          data-testid='delete-user-action'
          onClick={() => {
            handleAction('delete');
          }}
          sx={{ color: 'error.main' }}
        >
          <ListItemIcon>
            <DeleteIcon fontSize='small' color='error' />
          </ListItemIcon>
          <ListItemText>{ADMIN_LABELS.deleteUser}</ListItemText>
        </MenuItem>
      </Menu>
    </Paper>
  );
}
