/**
 * MaterialLinkSelector Component
 *
 * Renders a "+" button next to each curriculum topic.
 * On click, shows a dropdown of available seminar materials.
 * Selecting a material links it to the topic via the API.
 * Linked materials are shown as chips below the topic row.
 */

'use client';

import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import CloseIcon from '@mui/icons-material/Close';
import DescriptionIcon from '@mui/icons-material/Description';
import {
  Box,
  Chip,
  CircularProgress,
  IconButton,
  Menu,
  MenuItem,
  Tooltip,
  Typography,
} from '@mui/material';
import { useCallback, useEffect, useState } from 'react';

interface MaterialInfo {
  id: string;
  materialId: string;
  title: string;
  identifier: string;
  sortOrder: number;
}

interface SeminarMaterial {
  id: string;
  title: string;
  identifier: string;
}

interface MaterialLinkSelectorProps {
  courseId: string;
  topicId: string;
  disabled?: boolean;
}

export default function MaterialLinkSelector({
  courseId,
  topicId,
  disabled = false,
}: MaterialLinkSelectorProps) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [linkedMaterials, setLinkedMaterials] = useState<MaterialInfo[]>([]);
  const [allMaterials, setAllMaterials] = useState<SeminarMaterial[]>([]);
  const [loading, setLoading] = useState(false);
  const [materialsLoaded, setMaterialsLoaded] = useState(false);

  // Load linked materials for this topic on mount
  useEffect(() => {
    let cancelled = false;

    async function loadLinks() {
      try {
        const res = await fetch(
          `/api/admin/courses/${courseId}/curriculum-materials`
        );
        if (!res.ok) return;
        const json = await res.json();
        const topicLinks = json.data?.[topicId] ?? [];
        if (!cancelled) {
          setLinkedMaterials(topicLinks);
        }
      } catch {
        // Silently fail for UX
      }
    }

    loadLinks();
    return () => {
      cancelled = true;
    };
  }, [courseId, topicId]);

  // Load all available materials when menu opens
  const handleOpenMenu = useCallback(
    async (event: React.MouseEvent<HTMLElement>) => {
      setAnchorEl(event.currentTarget);

      if (!materialsLoaded) {
        setLoading(true);
        try {
          const res = await fetch('/api/admin/course-material');
          if (res.ok) {
            const json = await res.json();
            const materials = Array.isArray(json)
              ? json
              : (json.materials ?? json.data ?? []);
            setAllMaterials(materials);
            setMaterialsLoaded(true);
          }
        } catch {
          // Silently fail
        } finally {
          setLoading(false);
        }
      }
    },
    [materialsLoaded]
  );

  const handleCloseMenu = useCallback(() => {
    setAnchorEl(null);
  }, []);

  const handleAddMaterial = useCallback(
    async (materialId: string) => {
      handleCloseMenu();

      try {
        const res = await fetch(
          `/api/admin/courses/${courseId}/curriculum-materials`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              topicId,
              materialId,
              sortOrder: linkedMaterials.length,
            }),
          }
        );

        if (res.ok) {
          const json = await res.json();
          const link = json.data;
          setLinkedMaterials(prev => [
            ...prev,
            {
              id: link.id,
              materialId: link.materialId,
              title: link.material.title,
              identifier: link.material.identifier,
              sortOrder: link.sortOrder,
            },
          ]);
        }
      } catch {
        // Silently fail
      }
    },
    [courseId, topicId, linkedMaterials.length, handleCloseMenu]
  );

  const handleRemoveMaterial = useCallback(
    async (linkId: string) => {
      try {
        const res = await fetch(
          `/api/admin/courses/${courseId}/curriculum-materials/${linkId}`,
          { method: 'DELETE' }
        );

        if (res.ok) {
          setLinkedMaterials(prev => prev.filter(m => m.id !== linkId));
        }
      } catch {
        // Silently fail
      }
    },
    [courseId]
  );

  // Filter out already-linked materials from dropdown
  const linkedIds = new Set(linkedMaterials.map(m => m.materialId));
  const availableMaterials = allMaterials.filter(m => !linkedIds.has(m.id));

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
      {/* Linked materials as chips */}
      {linkedMaterials.length > 0 && (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
          {linkedMaterials.map(mat => (
            <Chip
              key={mat.id}
              icon={<DescriptionIcon />}
              label={mat.title}
              size='small'
              variant='outlined'
              color='primary'
              onDelete={
                disabled ? undefined : () => handleRemoveMaterial(mat.id)
              }
              deleteIcon={<CloseIcon />}
              sx={{ maxWidth: 220 }}
            />
          ))}
        </Box>
      )}

      {/* Add button */}
      <Tooltip title='Seminarmaterial verknüpfen'>
        <span>
          <IconButton
            size='small'
            color='primary'
            onClick={handleOpenMenu}
            disabled={disabled}
            sx={{ alignSelf: 'flex-start' }}
          >
            <AddCircleOutlineIcon fontSize='small' />
          </IconButton>
        </span>
      </Tooltip>

      {/* Material selection dropdown */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleCloseMenu}
        slotProps={{
          paper: {
            sx: { maxHeight: 300, minWidth: 250 },
          },
        }}
      >
        {loading ? (
          <MenuItem disabled>
            <CircularProgress size={20} sx={{ mr: 1 }} />
            Lade Materialien…
          </MenuItem>
        ) : availableMaterials.length === 0 ? (
          <MenuItem disabled>
            <Typography variant='body2' color='text.secondary'>
              {allMaterials.length === 0
                ? 'Keine Materialien vorhanden'
                : 'Alle Materialien bereits verknüpft'}
            </Typography>
          </MenuItem>
        ) : (
          availableMaterials.map(mat => (
            <MenuItem key={mat.id} onClick={() => handleAddMaterial(mat.id)}>
              <DescriptionIcon
                fontSize='small'
                sx={{ mr: 1, color: 'text.secondary' }}
              />
              {mat.title}
            </MenuItem>
          ))
        )}
      </Menu>
    </Box>
  );
}
