'use client';

/**
 * SeminarMaterialTable Component - Admin data table for seminar materials
 * Feature: 023-slide-editor
 *
 * Displays all seminar materials in a searchable, paginated table
 * with actions for viewing, editing, and deleting.
 */

import {
  Add as AddIcon,
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
  CircularProgress,
  IconButton,
  InputAdornment,
  Paper,
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
import { normalizeForSearch } from '@/lib/utils/searchNormalization';
import { DeleteConfirmationDialog } from './DeleteConfirmationDialog';

interface SeminarMaterial {
  id: string;
  identifier: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

interface SeminarMaterialTableProps {
  onRefresh?: () => void;
}

/**
 * Format date for display (German locale)
 */
function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export default function SeminarMaterialTable({
  onRefresh,
}: SeminarMaterialTableProps) {
  const router = useRouter();
  const [materials, setMaterials] = useState<SeminarMaterial[]>([]);
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
    useState<SeminarMaterial | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchMaterials = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/course-material');
      if (!response.ok) {
        throw new Error('Fehler beim Laden der Materialien');
      }
      const data = await response.json();
      setMaterials(data.materials || []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Ein Fehler ist aufgetreten'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMaterials();
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
    fetchMaterials();
    onRefresh?.();
  };

  const handleView = (id: string) => {
    router.push(`/admin/course-material/${id}`);
  };

  const handleEdit = (id: string) => {
    router.push(`/admin/course-material/${id}/edit`);
  };

  const handleDeleteClick = (material: SeminarMaterial) => {
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
      fetchMaterials();
    } catch (err) {
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
        <Alert severity='error' sx={{ mb: 2 }} onClose={() => setError(null)}>
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
              onClick={() => router.push('/admin/course-material/new')}
            >
              Neues Material
            </Button>
          </Box>
        </Box>

        <TableContainer>
          <Table stickyHeader aria-label='Seminarmaterial Tabelle'>
            <TableHead>
              <TableRow sx={{ bgcolor: 'background.paper' }}>
                <TableCell>Titel</TableCell>
                <TableCell>Kennung</TableCell>
                <TableCell>Erstellt am</TableCell>
                <TableCell>Aktualisiert am</TableCell>
                <TableCell align='right'>Aktionen</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedMaterials.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align='center'>
                    <Typography color='text.secondary' sx={{ py: 4 }}>
                      {searchQuery
                        ? 'Keine Materialien gefunden'
                        : 'Noch keine Seminarmaterialien vorhanden'}
                    </Typography>
                    {!searchQuery && (
                      <Button
                        variant='outlined'
                        startIcon={<AddIcon />}
                        onClick={() =>
                          router.push('/admin/course-material/new')
                        }
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
                        {formatDate(material.createdAt)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant='body2'>
                        {formatDate(material.updatedAt)}
                      </Typography>
                    </TableCell>
                    <TableCell align='right'>
                      <Tooltip title='Ansehen'>
                        <IconButton
                          size='small'
                          onClick={() => handleView(material.id)}
                          aria-label={`${material.title} ansehen`}
                        >
                          <ViewIcon fontSize='small' />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title='Bearbeiten'>
                        <IconButton
                          size='small'
                          onClick={() => handleEdit(material.id)}
                          aria-label={`${material.title} bearbeiten`}
                        >
                          <EditIcon fontSize='small' />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title='Löschen'>
                        <IconButton
                          size='small'
                          onClick={() => handleDeleteClick(material)}
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
    </>
  );
}
