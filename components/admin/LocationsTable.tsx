'use client';

/**
 * LocationsTable Component - Admin data table for locations
 * Feature: 015-course-locations
 * Task: T035
 */

import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Map as MapIcon,
  Place as PlaceIcon,
  Search as SearchIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material';
import {
  Box,
  Button,
  Chip,
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
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import type { LocationResponse } from '@/lib/schemas/location-schema';
import { TERMS } from '../../lib/constants';

interface LocationsTableProps {
  locations: LocationResponse[];
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export default function LocationsTable({
  locations,
  onEdit,
  onDelete,
}: LocationsTableProps) {
  const router = useRouter();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');

  // Filter locations based on search
  const filteredLocations = locations.filter(location => {
    const searchLower = searchQuery.toLowerCase();
    return (
      (location.name?.toLowerCase() ?? '').includes(searchLower) ||
      (location.city?.toLowerCase() ?? '').includes(searchLower) ||
      (location.address?.toLowerCase() ?? '').includes(searchLower)
    );
  });

  // Paginate
  const paginatedLocations = filteredLocations.slice(
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

  const handleView = (slug: string) => {
    router.push(`/locations/${slug}`);
  };

  return (
    <Paper
      sx={{ width: '100%', overflow: 'hidden', bgcolor: 'background.paper' }}
    >
      {/* Search and Actions Bar */}
      <Box
        sx={{
          p: 2,
          display: 'flex',
          gap: 2,
          alignItems: 'center',
          flexWrap: 'wrap',
        }}
      >
        <TextField
          fullWidth
          size='small'
          placeholder='Suchen nach Name, Stadt oder Adresse...'
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
        <Link href='/admin/locations/new' style={{ textDecoration: 'none' }}>
          <Button variant='contained' startIcon={<AddIcon />}>
            Neue Location
          </Button>
        </Link>
      </Box>

      <TableContainer>
        <Table stickyHeader aria-label='Locations Tabelle'>
          <TableHead>
            <TableRow sx={{ bgcolor: 'background.paper' }}>
              <TableCell>Name</TableCell>
              <TableCell>Adresse</TableCell>
              <TableCell>Stadt</TableCell>
              <TableCell align='center'>Karte</TableCell>
              <TableCell align='center'>Kurse</TableCell>
              <TableCell align='right'>Aktionen</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedLocations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align='center'>
                  <Typography color='text.secondary' sx={{ py: 4 }}>
                    {searchQuery
                      ? 'Keine Locations gefunden'
                      : 'Noch keine Locations vorhanden'}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              paginatedLocations.map(location => {
                const courseCount = location._count?.courses ?? 0;
                const hasCoordinates =
                  location.latitude !== null && location.longitude !== null;

                return (
                  <TableRow
                    key={location.id}
                    hover
                    sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                  >
                    <TableCell>
                      <Box
                        sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                      >
                        <PlaceIcon fontSize='small' color='action' />
                        <Typography variant='body2' fontWeight='medium'>
                          {location.name}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant='body2' color='text.secondary'>
                        {location.address}
                        {location.zipCode && `, ${location.zipCode}`}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant='body2'>{location.city}</Typography>
                    </TableCell>
                    <TableCell align='center'>
                      {hasCoordinates ? (
                        <Tooltip title='Koordinaten vorhanden'>
                          <MapIcon color='success' fontSize='small' />
                        </Tooltip>
                      ) : (
                        <Tooltip title='Keine Koordinaten'>
                          <MapIcon color='disabled' fontSize='small' />
                        </Tooltip>
                      )}
                    </TableCell>
                    <TableCell align='center'>
                      {courseCount > 0 ? (
                        <Chip
                          label={courseCount}
                          size='small'
                          color='primary'
                          variant='outlined'
                        />
                      ) : (
                        <Typography variant='body2' color='text.disabled'>
                          0
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell align='right'>
                      <Tooltip title='Ansehen'>
                        <IconButton
                          size='small'
                          onClick={() => handleView(location.slug)}
                          aria-label={`${location.name} ansehen`}
                        >
                          <ViewIcon fontSize='small' />
                        </IconButton>
                      </Tooltip>
                      {onEdit && (
                        <Tooltip title='Bearbeiten'>
                          <IconButton
                            size='small'
                            onClick={() => onEdit(location.id)}
                            aria-label={`${location.name} bearbeiten`}
                          >
                            <EditIcon fontSize='small' />
                          </IconButton>
                        </Tooltip>
                      )}
                      {onDelete && (
                        <Tooltip
                          title={
                            courseCount > 0
                              ? `Wird von ${TERMS.coursesDative} verwendet`
                              : 'Löschen'
                          }
                        >
                          <span>
                            <IconButton
                              size='small'
                              onClick={() => onDelete(location.id)}
                              aria-label={`${location.name} löschen`}
                              color='error'
                              disabled={courseCount > 0}
                            >
                              <DeleteIcon fontSize='small' />
                            </IconButton>
                          </span>
                        </Tooltip>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        rowsPerPageOptions={[5, 10, 25]}
        component='div'
        count={filteredLocations.length}
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
  );
}
