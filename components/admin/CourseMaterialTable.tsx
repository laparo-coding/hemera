'use client';

/**
 * CourseMaterialTable Component - Admin data table for course materials
 * Feature: 024-admin-dashboard
 *
 * Displays all course materials in a searchable, paginated table
 * with actions for viewing, editing, and deleting.
 */

import {
  Add as AddIcon,
  Close as CloseIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  InputAdornment,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import type { MaterialType } from '@/lib/schemas/admin/course-material';
import { normalizeForSearch } from '@/lib/utils/searchNormalization';
import { DeleteConfirmationDialog } from './DeleteConfirmationDialog';

interface CourseMaterial {
  id: string;
  identifier: string;
  title: string;
  type: MaterialType;
  blobUrl: string;
  createdAt: string;
  updatedAt: string;
}

// Centralized material type display configuration
const MATERIAL_TYPE_CONFIG: Record<
  string,
  { label: string; color: 'default' | 'secondary' }
> = {
  SLIDE_CONTROL: { label: 'Steuerdatei', color: 'secondary' },
  CONTENT: { label: 'Inhaltsseite', color: 'default' },
};

const DEFAULT_TYPE_CONFIG = { label: 'Unbekannt', color: 'default' as const };

function getTypeConfig(type: string) {
  return MATERIAL_TYPE_CONFIG[type] ?? DEFAULT_TYPE_CONFIG;
}

interface CourseMaterialTableProps {
  onRefresh?: () => void;
}

/**
 * Format date for table display (German locale, short format)
 * Uses Europe/Berlin timezone for consistent display.
 */
function formatTableDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'Europe/Berlin',
  });
}

export default function CourseMaterialTable({
  onRefresh,
}: CourseMaterialTableProps) {
  const router = useRouter();
  const [materials, setMaterials] = useState<CourseMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Search
  const [searchQuery, setSearchQuery] = useState('');

  // Delete dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [materialToDelete, setMaterialToDelete] =
    useState<CourseMaterial | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // View dialog
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [viewMaterial, setViewMaterial] = useState<CourseMaterial | null>(null);
  const [viewHtmlContent, setViewHtmlContent] = useState<string>('');
  const [viewLoading, setViewLoading] = useState(false);

  const fetchMaterials = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/course-material', { signal });
      if (!response.ok) {
        throw new Error('Fehler beim Laden der Materialien');
      }
      const data = await response.json();
      setMaterials(data.materials || []);
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      setError(
        err instanceof Error ? err.message : 'Ein Fehler ist aufgetreten'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void fetchMaterials(controller.signal);
    return () => {
      controller.abort();
    };
  }, [fetchMaterials]);

  // Filter materials based on search
  const filteredMaterials = materials.filter(material => {
    const searchLower = normalizeForSearch(searchQuery);
    return (
      normalizeForSearch(material.title).includes(searchLower) ||
      normalizeForSearch(material.identifier).includes(searchLower)
    );
  });

  // Paginate
  const paginatedMaterials = filteredMaterials.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleRefresh = () => {
    void fetchMaterials();
    onRefresh?.();
  };

  const handleView = async (material: CourseMaterial) => {
    setViewMaterial(material);
    setViewDialogOpen(true);
    setViewHtmlContent('');

    // SLIDE_CONTROL materials are rendered via sandboxed iframe using blobUrl
    if (material.type === 'SLIDE_CONTROL') {
      setViewLoading(false);
      return;
    }

    setViewLoading(true);

    try {
      const response = await fetch(
        `/api/admin/course-material/${material.id}/content`
      );
      if (!response.ok) {
        throw new Error('Fehler beim Laden des Inhalts');
      }
      const data = await response.json();
      setViewHtmlContent(data.htmlContent || '');
    } catch (err) {
      setViewHtmlContent(
        `<p style="color:red">${err instanceof Error ? err.message : 'Fehler beim Laden'}</p>`
      );
    } finally {
      setViewLoading(false);
    }
  };

  const handleViewClose = () => {
    setViewDialogOpen(false);
    setViewMaterial(null);
    setViewHtmlContent('');
  };

  const handleEdit = (id: string) => {
    router.push(`/admin/course-material/${id}/edit`);
  };

  const handleDeleteClick = (material: CourseMaterial) => {
    setMaterialToDelete(material);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!materialToDelete) return;

    setDeleteLoading(true);
    try {
      const response = await fetch(
        `/api/admin/course-material/${materialToDelete.id}`,
        {
          method: 'DELETE',
        }
      );

      if (!response.ok) {
        throw new Error('Fehler beim Löschen');
      }

      setDeleteDialogOpen(false);
      setMaterialToDelete(null);
      void fetchMaterials();
    } catch (err) {
      setDeleteDialogOpen(false);
      setMaterialToDelete(null);
      setError(err instanceof Error ? err.message : 'Fehler beim Löschen');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setMaterialToDelete(null);
  };

  if (loading && materials.length === 0) {
    return (
      <Box display='flex' justifyContent='center' py={4}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <>
      {error && (
        <Alert
          severity='error'
          sx={{ mb: 2 }}
          onClose={() => {
            setError(null);
          }}
        >
          {error}
          <Button onClick={handleRefresh} size='small' sx={{ ml: 2 }}>
            Erneut versuchen
          </Button>
        </Alert>
      )}

      <Paper
        sx={{ width: '100%', overflow: 'hidden', bgcolor: 'background.paper' }}
      >
        {/* Toolbar */}
        <Box
          sx={{
            p: 2,
            display: 'flex',
            gap: 2,
            alignItems: 'center',
            flexWrap: 'wrap',
          }}
        >
          {/* Search */}
          <TextField
            size='small'
            placeholder='Suchen nach Titel oder Kennung...'
            value={searchQuery}
            onChange={e => {
              setSearchQuery(e.target.value);
              setPage(0);
            }}
            sx={{ minWidth: 280, flex: 1 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position='start'>
                  <SearchIcon color='action' />
                </InputAdornment>
              ),
            }}
          />

          {/* Actions */}
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title='Aktualisieren'>
              <IconButton onClick={handleRefresh} disabled={loading}>
                <RefreshIcon />
              </IconButton>
            </Tooltip>
            <Button
              variant='contained'
              startIcon={<AddIcon />}
              onClick={() => {
                router.push('/admin/course-material/new');
              }}
            >
              Neues Material
            </Button>
          </Box>
        </Box>

        <TableContainer>
          <Table stickyHeader aria-label='Seminarmaterial Tabelle'>
            <TableHead>
              <TableRow
                sx={{
                  bgcolor: 'background.paper',
                  '& th': { backgroundColor: 'background.paper' },
                }}
              >
                <TableCell>Titel</TableCell>
                <TableCell>Typ</TableCell>
                <TableCell>Kennung</TableCell>
                <TableCell>Erstellt am</TableCell>
                <TableCell>Aktualisiert am</TableCell>
                <TableCell align='right'>Aktionen</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedMaterials.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align='center'>
                    <Typography color='text.secondary' sx={{ py: 4 }}>
                      {searchQuery
                        ? 'Keine Materialien gefunden'
                        : 'Noch keine Seminarmaterialien vorhanden'}
                    </Typography>
                    {!searchQuery && (
                      <Button
                        variant='outlined'
                        startIcon={<AddIcon />}
                        onClick={() => {
                          router.push('/admin/course-material/new');
                        }}
                        sx={{ mt: 1 }}
                      >
                        Erstes Material erstellen
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ) : (
                paginatedMaterials.map(material => (
                  <TableRow
                    key={material.id}
                    hover
                    sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                  >
                    <TableCell>
                      <Typography variant='body2' fontWeight='medium'>
                        {material.title}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={getTypeConfig(material.type).label}
                        size='small'
                        color={getTypeConfig(material.type).color}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography
                        variant='body2'
                        color='text.secondary'
                        sx={{ fontFamily: 'monospace' }}
                      >
                        {material.identifier}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant='body2'>
                        {formatTableDate(material.createdAt)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant='body2'>
                        {formatTableDate(material.updatedAt)}
                      </Typography>
                    </TableCell>
                    <TableCell align='right'>
                      <Tooltip title='Ansehen'>
                        <IconButton
                          size='small'
                          onClick={() => handleView(material)}
                          aria-label={`${material.title} ansehen`}
                        >
                          <ViewIcon fontSize='small' />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title='Bearbeiten'>
                        <IconButton
                          size='small'
                          onClick={() => {
                            handleEdit(material.id);
                          }}
                          aria-label={`${material.title} bearbeiten`}
                        >
                          <EditIcon fontSize='small' />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title='Löschen'>
                        <IconButton
                          size='small'
                          onClick={() => {
                            handleDeleteClick(material);
                          }}
                          aria-label={`${material.title} löschen`}
                          color='error'
                        >
                          <DeleteIcon fontSize='small' />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component='div'
          count={filteredMaterials.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage='Zeilen pro Seite:'
          labelDisplayedRows={({ from, to, count }) =>
            `${from}–${to} von ${count !== -1 ? count : `mehr als ${to}`}`
          }
        />
      </Paper>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        title='Seminarmaterial löschen'
        message={`Möchtest du "${materialToDelete?.title}" wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.`}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
        loading={deleteLoading}
      />

      {/* View Material Dialog */}
      <Dialog
        open={viewDialogOpen}
        onClose={handleViewClose}
        maxWidth='md'
        fullWidth
        scroll='paper'
      >
        <DialogTitle>
          <Stack
            direction='row'
            justifyContent='space-between'
            alignItems='center'
          >
            <Typography variant='h6' component='span'>
              {viewMaterial?.title ?? 'Seminarmaterial'}
            </Typography>
            <IconButton
              onClick={handleViewClose}
              aria-label='Schließen'
              size='small'
            >
              <CloseIcon />
            </IconButton>
          </Stack>
          {viewMaterial && (
            <Stack direction='row' spacing={3} sx={{ mt: 1 }}>
              <Typography variant='body2' color='text.secondary'>
                Kennung:{' '}
                <Box component='span' sx={{ fontFamily: 'monospace' }}>
                  {viewMaterial.identifier}
                </Box>
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                Erstellt: {formatTableDate(viewMaterial.createdAt)}
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                Aktualisiert: {formatTableDate(viewMaterial.updatedAt)}
              </Typography>
            </Stack>
          )}
        </DialogTitle>
        <DialogContent dividers>
          {viewLoading ? (
            <Box display='flex' justifyContent='center' py={4}>
              <CircularProgress />
            </Box>
          ) : viewMaterial?.type === 'SLIDE_CONTROL' ? (
            <Box
              component='iframe'
              src={viewMaterial.blobUrl}
              sandbox='allow-scripts'
              sx={{
                width: '100%',
                height: '70vh',
                border: 'none',
              }}
              title={viewMaterial.title}
            />
          ) : (
            <Box
              sx={{
                '& img': { maxWidth: '100%', height: 'auto' },
                '& h1, & h2, & h3': { mt: 2, mb: 1 },
                '& p': { mb: 1 },
                '& ul, & ol': { pl: 3, mb: 1 },
              }}
              dangerouslySetInnerHTML={{ __html: viewHtmlContent }} // nosemgrep: react-dangerouslysetinnerhtml - HTML content sanitized via lib/utils/html-sanitizer.ts on upload
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
