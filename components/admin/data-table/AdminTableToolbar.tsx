'use client';

/**
 * AdminTableToolbar Component
 * Feature: 024-admin-dashboard
 *
 * Unified toolbar for admin data tables with search,
 * filters, and custom actions.
 */

import {
  FilterList as FilterIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import {
  Box,
  Checkbox,
  FormControl,
  FormControlLabel,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from '@mui/material';
import { useCallback, useState } from 'react';
import type { AdminTableFilter, AdminTableSearchConfig } from './types';

interface AdminTableToolbarProps {
  /** Toolbar title */
  title?: string;
  /** Total item count for display */
  totalCount?: number;
  /** Whether search is enabled */
  searchable?: boolean;
  /** Search configuration */
  searchConfig?: AdminTableSearchConfig;
  /** Current search value */
  searchValue?: string;
  /** Search change handler */
  onSearchChange?: (value: string) => void;
  /** Filter definitions */
  filters?: AdminTableFilter[];
  /** Current filter values */
  filterValues?: Record<string, string | boolean>;
  /** Filter change handler */
  onFilterChange?: (filterId: string, value: string | boolean) => void;
  /** Additional toolbar actions */
  toolbarActions?: React.ReactNode;
}

export default function AdminTableToolbar({
  title,
  totalCount,
  searchable = false,
  searchConfig,
  searchValue = '',
  onSearchChange,
  filters = [],
  filterValues = {},
  onFilterChange,
  toolbarActions,
}: AdminTableToolbarProps) {
  const [localSearchValue, setLocalSearchValue] = useState(searchValue);

  const handleSearchChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value;
      setLocalSearchValue(value);
      onSearchChange?.(value);
    },
    [onSearchChange]
  );

  const handleFilterChange = useCallback(
    (filterId: string, value: string | boolean) => {
      onFilterChange?.(filterId, value);
    },
    [onFilterChange]
  );

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: { xs: 'column', md: 'row' },
        alignItems: { xs: 'stretch', md: 'center' },
        justifyContent: 'space-between',
        gap: 2,
        mb: 2,
        flexWrap: 'wrap',
      }}
    >
      {/* Title Section */}
      {title && (
        <Typography variant='h6' component='div' sx={{ flexShrink: 0 }}>
          {title}
          {totalCount !== undefined && (
            <Typography
              component='span'
              variant='body2'
              color='text.secondary'
              sx={{ ml: 1 }}
            >
              ({totalCount})
            </Typography>
          )}
        </Typography>
      )}

      {/* Search and Filters */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: { xs: 'stretch', sm: 'center' },
          gap: 2,
          flex: 1,
          justifyContent: { sm: 'flex-end' },
        }}
      >
        {/* Search Field */}
        {searchable && (
          <TextField
            size='small'
            placeholder={searchConfig?.placeholder || 'Suchen...'}
            value={localSearchValue}
            onChange={handleSearchChange}
            InputProps={{
              startAdornment: (
                <InputAdornment position='start'>
                  <SearchIcon color='action' />
                </InputAdornment>
              ),
            }}
            sx={{
              minWidth: { xs: '100%', sm: 220 },
              maxWidth: { sm: 300 },
            }}
          />
        )}

        {/* Filters */}
        {filters.map(filter => {
          if (filter.type === 'select' && filter.options) {
            return (
              <FormControl key={filter.id} size='small' sx={{ minWidth: 150 }}>
                <InputLabel>{filter.label}</InputLabel>
                <Select
                  value={
                    (filterValues[filter.id] as string) ||
                    filter.defaultValue ||
                    ''
                  }
                  label={filter.label}
                  onChange={e => handleFilterChange(filter.id, e.target.value)}
                  startAdornment={
                    <InputAdornment position='start'>
                      <FilterIcon fontSize='small' color='action' />
                    </InputAdornment>
                  }
                >
                  {filter.options.map(option => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            );
          }

          if (filter.type === 'checkbox') {
            return (
              <FormControlLabel
                key={filter.id}
                control={
                  <Checkbox
                    checked={(filterValues[filter.id] as boolean) || false}
                    onChange={e =>
                      handleFilterChange(filter.id, e.target.checked)
                    }
                    size='small'
                  />
                }
                label={filter.label}
              />
            );
          }

          return null;
        })}

        {/* Custom Toolbar Actions */}
        {toolbarActions}
      </Box>
    </Box>
  );
}
