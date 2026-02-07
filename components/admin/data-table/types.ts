/**
 * AdminDataTable Type Definitions
 * Feature: 024-admin-dashboard
 *
 * Unified type system for admin data tables providing
 * consistent pagination, search, filtering, and actions.
 */

import type { ReactNode } from 'react';

/**
 * Column definition for AdminDataTable
 */
export interface AdminTableColumn<T> {
  /** Unique column identifier */
  id: string;
  /** Display label in table header */
  label: string;
  /** Minimum width in pixels */
  minWidth?: number;
  /** Text alignment */
  align?: 'left' | 'center' | 'right';
  /** Whether this column should be sticky */
  sticky?: boolean;
  /** Custom render function for cell content */
  render?: (row: T) => ReactNode;
  /** Key path for accessing data (dot notation supported) */
  accessor?: keyof T | string;
  /** Whether column is sortable */
  sortable?: boolean;
  /** Whether to hide on mobile */
  hiddenOnMobile?: boolean;
}

/**
 * Row action definition for AdminDataTable
 */
export interface AdminTableAction<T> {
  /** Unique action identifier */
  id: string;
  /** Tooltip text */
  label: string;
  /** MUI icon component */
  icon: ReactNode;
  /** Action color */
  color?:
    | 'inherit'
    | 'primary'
    | 'secondary'
    | 'success'
    | 'error'
    | 'info'
    | 'warning';
  /** Click handler */
  onClick: (row: T) => void;
  /** Conditionally show action */
  show?: (row: T) => boolean;
  /** Conditionally disable action */
  disabled?: (row: T) => boolean;
}

/**
 * Filter option for dropdown filters
 */
export interface AdminTableFilterOption {
  /** Option value */
  value: string;
  /** Display label */
  label: string;
}

/**
 * Filter definition for AdminDataTable
 */
export interface AdminTableFilter {
  /** Unique filter identifier */
  id: string;
  /** Display label */
  label: string;
  /** Filter type */
  type: 'select' | 'checkbox' | 'date-range';
  /** Available options for select type */
  options?: AdminTableFilterOption[];
  /** Default value */
  defaultValue?: string | boolean;
}

/**
 * Pagination configuration
 */
export interface AdminTablePaginationConfig {
  /** Available rows per page options */
  rowsPerPageOptions?: number[];
  /** Default rows per page */
  defaultRowsPerPage?: number;
  /** Label for rows per page dropdown */
  rowsPerPageLabel?: string;
}

/**
 * Search configuration
 */
export interface AdminTableSearchConfig {
  /** Placeholder text for search input */
  placeholder?: string;
  /** Debounce delay in milliseconds */
  debounceMs?: number;
  /** Keys to search in (supports dot notation) */
  searchKeys?: string[];
}

/**
 * Empty state configuration
 */
export interface AdminTableEmptyStateConfig {
  /** Title when no data */
  title: string;
  /** Description when no data */
  description?: string;
  /** Title when search returns no results */
  searchEmptyTitle?: string;
  /** Description when search returns no results */
  searchEmptyDescription?: string;
  /** Custom icon component */
  icon?: ReactNode;
  /** Optional action button */
  action?: {
    label: string;
    onClick: () => void;
  };
}

/**
 * Main AdminDataTable props
 */
export interface AdminDataTableProps<T> {
  /** Table data */
  data: T[];
  /** Column definitions */
  columns: AdminTableColumn<T>[];
  /** Function to extract unique key from row */
  keyExtractor: (row: T) => string;
  /** Row actions */
  actions?: AdminTableAction<T>[];
  /** Whether table is loading */
  loading?: boolean;
  /** Error message to display */
  error?: string | null;
  /** Error retry handler */
  onRetry?: () => void;
  /** Whether to show search */
  searchable?: boolean;
  /** Search configuration */
  searchConfig?: AdminTableSearchConfig;
  /** Whether to show pagination */
  paginated?: boolean;
  /** Pagination configuration */
  paginationConfig?: AdminTablePaginationConfig;
  /** Filter definitions */
  filters?: AdminTableFilter[];
  /** Empty state configuration */
  emptyState?: AdminTableEmptyStateConfig;
  /** Toolbar title */
  title?: string;
  /** Additional toolbar actions */
  toolbarActions?: ReactNode;
  /** Row click handler */
  onRowClick?: (row: T) => void;
  /** Whether rows are selectable */
  selectable?: boolean;
  /** Selected row keys */
  selectedKeys?: string[];
  /** Selection change handler */
  onSelectionChange?: (keys: string[]) => void;
  /** Custom row class name */
  rowClassName?: (row: T) => string;
  /** Size variant */
  size?: 'small' | 'medium';
  /** Whether to use sticky header */
  stickyHeader?: boolean;
  /** Maximum table height (enables scroll) */
  maxHeight?: number | string;
  /** Paper elevation */
  elevation?: number;
}
