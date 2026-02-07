'use client';

/**
 * AdminDataTable Component
 * Feature: 024-admin-dashboard
 *
 * Unified data table component for admin interfaces providing
 * consistent pagination, search, filtering, and row actions
 * across all admin tables in the application.
 *
 * Design System Standards:
 * - TablePagination with [5, 10, 25] row options
 * - Instant search with SearchIcon
 * - Tooltips on all action buttons
 * - Sticky headers for scrollable tables
 * - German locale for all labels
 */

import {
  Alert,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Tooltip,
} from '@mui/material';
import { useCallback, useMemo, useState } from 'react';
import AdminTableEmptyState from './AdminTableEmptyState';
import AdminTableToolbar from './AdminTableToolbar';
import type { AdminDataTableProps, AdminTableColumn } from './types';

/**
 * Access nested object property via dot notation
 */
function getNestedValue<T>(obj: T, path: string): unknown {
  return path.split('.').reduce((current: unknown, key: string) => {
    if (current && typeof current === 'object' && key in current) {
      return (current as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);
}

/**
 * Default search function
 */
function defaultSearchFn<T>(
  item: T,
  searchQuery: string,
  searchKeys?: string[]
): boolean {
  if (!searchQuery.trim()) return true;

  const query = searchQuery.toLowerCase();

  // If no search keys specified, search all string/number values
  if (!searchKeys || searchKeys.length === 0) {
    return Object.values(item as Record<string, unknown>).some(value => {
      if (typeof value === 'string') {
        return value.toLowerCase().includes(query);
      }
      if (typeof value === 'number') {
        return value.toString().includes(query);
      }
      return false;
    });
  }

  // Search only specified keys
  return searchKeys.some(key => {
    const value = getNestedValue(item, key);
    if (typeof value === 'string') {
      return value.toLowerCase().includes(query);
    }
    if (typeof value === 'number') {
      return value.toString().includes(query);
    }
    return false;
  });
}

export default function AdminDataTable<T>({
  data,
  columns,
  keyExtractor,
  actions = [],
  loading = false,
  error = null,
  onRetry,
  searchable = false,
  searchConfig,
  paginated = true,
  paginationConfig,
  filters = [],
  emptyState,
  title,
  toolbarActions,
  onRowClick,
  selectable = false,
  selectedKeys = [],
  onSelectionChange,
  rowClassName,
  size = 'medium',
  stickyHeader = true,
  maxHeight,
  elevation = 1,
}: AdminDataTableProps<T>) {
  // Pagination state
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(
    paginationConfig?.defaultRowsPerPage || 10
  );

  // Search state
  const [searchQuery, setSearchQuery] = useState('');

  // Filter state
  const [filterValues, setFilterValues] = useState<
    Record<string, string | boolean>
  >(() => {
    const initial: Record<string, string | boolean> = {};
    filters.forEach(filter => {
      if (filter.defaultValue !== undefined) {
        initial[filter.id] = filter.defaultValue;
      }
    });
    return initial;
  });

  // Handle search change
  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
    setPage(0); // Reset to first page on search
  }, []);

  // Handle filter change
  const handleFilterChange = useCallback(
    (filterId: string, value: string | boolean) => {
      setFilterValues(prev => ({
        ...prev,
        [filterId]: value,
      }));
      setPage(0); // Reset to first page on filter change
    },
    []
  );

  // Handle page change
  const handlePageChange = useCallback((_: unknown, newPage: number) => {
    setPage(newPage);
  }, []);

  // Handle rows per page change
  const handleRowsPerPageChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setRowsPerPage(parseInt(event.target.value, 10));
      setPage(0);
    },
    []
  );

  // Handle selection
  const handleSelectAll = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      if (event.target.checked) {
        onSelectionChange?.(data.map(keyExtractor));
      } else {
        onSelectionChange?.([]);
      }
    },
    [data, keyExtractor, onSelectionChange]
  );

  const handleSelectRow = useCallback(
    (key: string) => {
      const newSelected = selectedKeys.includes(key)
        ? selectedKeys.filter(k => k !== key)
        : [...selectedKeys, key];
      onSelectionChange?.(newSelected);
    },
    [selectedKeys, onSelectionChange]
  );

  // Filter and search data
  const filteredData = useMemo(() => {
    return data.filter(item =>
      defaultSearchFn(item, searchQuery, searchConfig?.searchKeys)
    );
  }, [data, searchQuery, searchConfig?.searchKeys]);

  // Paginate data
  const paginatedData = useMemo(() => {
    if (!paginated) return filteredData;
    return filteredData.slice(
      page * rowsPerPage,
      page * rowsPerPage + rowsPerPage
    );
  }, [filteredData, paginated, page, rowsPerPage]);

  // Render cell content
  const renderCellContent = useCallback(
    (row: T, column: AdminTableColumn<T>) => {
      if (column.render) {
        return column.render(row);
      }
      if (column.accessor) {
        const value = getNestedValue(row, column.accessor as string);
        return value !== undefined && value !== null ? String(value) : '—';
      }
      return '—';
    },
    []
  );

  // Loading state
  if (loading) {
    return (
      <Box display='flex' justifyContent='center' py={4}>
        <CircularProgress />
      </Box>
    );
  }

  // Error state
  if (error) {
    return (
      <Alert severity='error' sx={{ mb: 2 }}>
        {error}
        {onRetry && (
          <Button onClick={onRetry} size='small' sx={{ ml: 2 }}>
            Erneut versuchen
          </Button>
        )}
      </Alert>
    );
  }

  // Empty state
  const isSearchEmpty = searchQuery.trim() !== '' && filteredData.length === 0;
  const isDataEmpty = data.length === 0;

  if (isDataEmpty || isSearchEmpty) {
    return (
      <>
        <AdminTableToolbar
          title={title}
          totalCount={data.length}
          searchable={searchable}
          searchConfig={searchConfig}
          searchValue={searchQuery}
          onSearchChange={handleSearchChange}
          filters={filters}
          filterValues={filterValues}
          onFilterChange={handleFilterChange}
          toolbarActions={toolbarActions}
        />
        <AdminTableEmptyState
          config={
            emptyState || {
              title: 'Keine Daten vorhanden',
              description: 'Es sind noch keine Einträge vorhanden.',
            }
          }
          isSearchEmpty={isSearchEmpty}
        />
      </>
    );
  }

  const rowsPerPageOptions = paginationConfig?.rowsPerPageOptions || [
    5, 10, 25,
  ];
  const isAllSelected = data.length > 0 && selectedKeys.length === data.length;
  const isPartialSelected =
    selectedKeys.length > 0 && selectedKeys.length < data.length;

  return (
    <>
      <AdminTableToolbar
        title={title}
        totalCount={filteredData.length}
        searchable={searchable}
        searchConfig={searchConfig}
        searchValue={searchQuery}
        onSearchChange={handleSearchChange}
        filters={filters}
        filterValues={filterValues}
        onFilterChange={handleFilterChange}
        toolbarActions={toolbarActions}
      />

      <Paper elevation={elevation}>
        <TableContainer sx={{ maxHeight }}>
          <Table stickyHeader={stickyHeader} size={size}>
            <TableHead>
              <TableRow>
                {selectable && (
                  <TableCell padding='checkbox'>
                    <Checkbox
                      indeterminate={isPartialSelected}
                      checked={isAllSelected}
                      onChange={handleSelectAll}
                    />
                  </TableCell>
                )}
                {columns.map(column => (
                  <TableCell
                    key={column.id}
                    align={column.align || 'left'}
                    style={{ minWidth: column.minWidth }}
                    sx={{
                      fontWeight: 600,
                      backgroundColor: 'background.paper',
                      ...(column.sticky && {
                        position: 'sticky',
                        left: 0,
                        zIndex: 1,
                      }),
                      ...(column.hiddenOnMobile && {
                        display: { xs: 'none', md: 'table-cell' },
                      }),
                    }}
                  >
                    {column.label}
                  </TableCell>
                ))}
                {actions.length > 0 && (
                  <TableCell
                    align='right'
                    sx={{
                      fontWeight: 600,
                      backgroundColor: 'background.paper',
                    }}
                  >
                    Aktionen
                  </TableCell>
                )}
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedData.map(row => {
                const rowKey = keyExtractor(row);
                const isSelected = selectedKeys.includes(rowKey);

                return (
                  <TableRow
                    key={rowKey}
                    hover
                    selected={isSelected}
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                    sx={{
                      cursor: onRowClick ? 'pointer' : 'default',
                    }}
                    className={rowClassName?.(row)}
                  >
                    {selectable && (
                      <TableCell padding='checkbox'>
                        <Checkbox
                          checked={isSelected}
                          onClick={e => e.stopPropagation()}
                          onChange={() => handleSelectRow(rowKey)}
                        />
                      </TableCell>
                    )}
                    {columns.map(column => (
                      <TableCell
                        key={column.id}
                        align={column.align || 'left'}
                        sx={{
                          ...(column.sticky && {
                            position: 'sticky',
                            left: 0,
                            backgroundColor: 'background.paper',
                            zIndex: 0,
                          }),
                          ...(column.hiddenOnMobile && {
                            display: { xs: 'none', md: 'table-cell' },
                          }),
                        }}
                      >
                        {renderCellContent(row, column)}
                      </TableCell>
                    ))}
                    {actions.length > 0 && (
                      <TableCell align='right'>
                        {actions
                          .filter(action => !action.show || action.show(row))
                          .map(action => (
                            <Tooltip key={action.id} title={action.label}>
                              <span>
                                <IconButton
                                  size='small'
                                  color={action.color || 'inherit'}
                                  onClick={e => {
                                    e.stopPropagation();
                                    action.onClick(row);
                                  }}
                                  disabled={action.disabled?.(row)}
                                >
                                  {action.icon}
                                </IconButton>
                              </span>
                            </Tooltip>
                          ))}
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>

        {paginated && (
          <TablePagination
            component='div'
            count={filteredData.length}
            page={page}
            onPageChange={handlePageChange}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleRowsPerPageChange}
            rowsPerPageOptions={rowsPerPageOptions}
            labelRowsPerPage={
              paginationConfig?.rowsPerPageLabel || 'Pro Seite:'
            }
            labelDisplayedRows={({ from, to, count }) =>
              `${from}–${to} von ${count}`
            }
          />
        )}
      </Paper>
    </>
  );
}
