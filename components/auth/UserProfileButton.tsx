/**
 * User Profile Button Component
 *
 * Displays user avatar/name with dropdown menu for authenticated users
 * Includes sign-out functionality and profile management
 */

'use client';

import { SignOutButton, useUser } from '@clerk/nextjs';
import {
  AccountCircle,
  Dashboard,
  ExitToApp,
  Settings,
} from '@mui/icons-material';
import {
  Avatar,
  Box,
  Button,
  Divider,
  IconButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Typography,
} from '@mui/material';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export interface UserProfileButtonProps {
  variant?: 'icon' | 'button';
}

export function UserProfileButton({
  variant = 'icon',
}: UserProfileButtonProps) {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleNavigate = (path: string) => {
    router.push(path);
    handleClose();
  };

  if (!isLoaded || !user) {
    return null;
  }

  const displayName =
    user.fullName || user.primaryEmailAddress?.emailAddress || 'User';
  const avatarSrc = user.imageUrl;

  const menuItems = [
    {
      label: 'Dashboard',
      icon: <Dashboard fontSize='small' />,
      path: '/dashboard',
    },
    {
      label: 'My Courses',
      icon: <Settings fontSize='small' />,
      path: '/my-courses',
    },
  ];

  if (variant === 'icon') {
    return (
      <>
        <IconButton
          onClick={handleClick}
          data-testid='user-profile-button'
          sx={{
            p: 0,
            '&:hover': {
              transform: 'scale(1.05)',
            },
            transition: 'transform 0.2s ease-in-out',
          }}
          aria-label='User menu'
          aria-controls={open ? 'user-menu' : undefined}
          aria-haspopup='true'
          aria-expanded={open ? 'true' : undefined}
        >
          <Avatar
            src={avatarSrc}
            alt={displayName}
            sx={{
              width: 32,
              height: 32,
              bgcolor: 'primary.main',
              fontSize: '14px',
              fontWeight: 500,
            }}
          >
            {displayName.charAt(0).toUpperCase()}
          </Avatar>
        </IconButton>

        <Menu
          id='user-menu'
          anchorEl={anchorEl}
          open={open}
          onClose={handleClose}
          onClick={handleClose}
          PaperProps={{
            elevation: 3,
            sx: {
              overflow: 'visible',
              filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
              mt: 1.5,
              minWidth: 200,
              '&:before': {
                content: '""',
                display: 'block',
                position: 'absolute',
                top: 0,
                right: 14,
                width: 10,
                height: 10,
                bgcolor: 'background.paper',
                transform: 'translateY(-50%) rotate(45deg)',
                zIndex: 0,
              },
            },
          }}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        >
          {/* User Info Header */}
          <Box
            sx={{
              px: 2,
              py: 1.5,
              borderBottom: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Typography variant='subtitle2' sx={{ fontWeight: 600 }}>
              {displayName}
            </Typography>
            <Typography variant='caption' color='text.secondary'>
              {user.primaryEmailAddress?.emailAddress}
            </Typography>
          </Box>

          {/* Navigation Items */}
          {menuItems.map(item => (
            <MenuItem
              key={item.path}
              onClick={() => handleNavigate(item.path)}
              sx={{
                py: 1,
                '&:hover': {
                  backgroundColor: 'action.hover',
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 36 }}>{item.icon}</ListItemIcon>
              <ListItemText primary={item.label} />
            </MenuItem>
          ))}

          <Divider sx={{ my: 1 }} />

          {/* Sign Out */}
          <SignOutButton>
            <MenuItem
              sx={{
                py: 1,
                color: 'error.main',
                '&:hover': {
                  backgroundColor: 'error.lighter',
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 36, color: 'error.main' }}>
                <ExitToApp fontSize='small' />
              </ListItemIcon>
              <ListItemText primary='Sign Out' />
            </MenuItem>
          </SignOutButton>
        </Menu>
      </>
    );
  }

  return (
    <>
      <Button
        onClick={handleClick}
        data-testid='user-profile-button'
        startIcon={
          <Avatar
            src={avatarSrc}
            alt={displayName}
            sx={{
              width: 24,
              height: 24,
              bgcolor: 'primary.main',
              fontSize: '12px',
            }}
          >
            {displayName.charAt(0).toUpperCase()}
          </Avatar>
        }
        endIcon={<AccountCircle />}
        sx={{
          textTransform: 'none',
          borderRadius: '8px',
          px: 2,
          py: 1,
          color: 'text.primary',
          '&:hover': {
            backgroundColor: 'action.hover',
          },
        }}
        aria-label='User menu'
        aria-controls={open ? 'user-menu' : undefined}
        aria-haspopup='true'
        aria-expanded={open ? 'true' : undefined}
      >
        <Typography
          variant='body2'
          sx={{
            maxWidth: 120,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {displayName}
        </Typography>
      </Button>

      <Menu
        id='user-menu'
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        onClick={handleClose}
        PaperProps={{
          elevation: 3,
          sx: {
            overflow: 'visible',
            filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
            mt: 1.5,
            minWidth: 200,
          },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        {/* User Info Header */}
        <Box
          sx={{
            px: 2,
            py: 1.5,
            borderBottom: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Typography variant='subtitle2' sx={{ fontWeight: 600 }}>
            {displayName}
          </Typography>
          <Typography variant='caption' color='text.secondary'>
            {user.primaryEmailAddress?.emailAddress}
          </Typography>
        </Box>

        {/* Navigation Items */}
        {menuItems.map(item => (
          <MenuItem
            key={item.path}
            onClick={() => handleNavigate(item.path)}
            sx={{
              py: 1,
              '&:hover': {
                backgroundColor: 'action.hover',
              },
            }}
          >
            <ListItemIcon sx={{ minWidth: 36 }}>{item.icon}</ListItemIcon>
            <ListItemText primary={item.label} />
          </MenuItem>
        ))}

        <Divider sx={{ my: 1 }} />

        {/* Sign Out */}
        <SignOutButton>
          <MenuItem
            sx={{
              py: 1,
              color: 'error.main',
              '&:hover': {
                backgroundColor: 'error.lighter',
              },
            }}
          >
            <ListItemIcon sx={{ minWidth: 36, color: 'error.main' }}>
              <ExitToApp fontSize='small' />
            </ListItemIcon>
            <ListItemText primary='Sign Out' />
          </MenuItem>
        </SignOutButton>
      </Menu>
    </>
  );
}

export default UserProfileButton;
