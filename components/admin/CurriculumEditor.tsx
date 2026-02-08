/**
 * CurriculumEditor Component
 *
 * Admin component for editing course curriculum (Seminarablauf).
 * Allows adding/removing days and topics with time ranges.
 */

'use client';

import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  TextField,
  Typography,
} from '@mui/material';
import dynamic from 'next/dynamic';
import { useCallback, useState } from 'react';
import { TERMS } from '../../lib/constants/terminology';

const MaterialLinkSelector = dynamic(() => import('./MaterialLinkSelector'), {
  ssr: false,
});

import type {
  CurriculumModule,
  CurriculumTopic,
} from '../../lib/schemas/admin/course';

interface CurriculumEditorProps {
  value: CurriculumModule[] | null | undefined;
  onChange: (curriculum: CurriculumModule[] | null) => void;
  disabled?: boolean;
  courseId?: string;
}

const generateId = () =>
  `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

const createEmptyTopic = (): CurriculumTopic => ({
  id: generateId(),
  timeRange: '09:00 - 09:30',
  title: '',
});

const createEmptyModule = (day: number): CurriculumModule => ({
  id: generateId(),
  day,
  title: `Tag ${day}`,
  topics: [createEmptyTopic()],
});

export default function CurriculumEditor({
  value,
  onChange,
  disabled = false,
  courseId,
}: CurriculumEditorProps) {
  // Normalize value to empty array if null/undefined
  const modules: CurriculumModule[] = value ?? [];

  const [expanded, setExpanded] = useState<string | false>(
    modules[0]?.id ?? false
  );

  // Confirmation dialog state
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    type: 'module' | 'topic';
    moduleId: string;
    topicId?: string;
    title: string;
  } | null>(null);

  const handleAccordionChange = useCallback(
    (panelId: string) => (_: React.SyntheticEvent, isExpanded: boolean) => {
      setExpanded(isExpanded ? panelId : false);
    },
    []
  );

  const addModule = useCallback(() => {
    const newDay = modules.length + 1;
    const newModule = createEmptyModule(newDay);
    onChange([...modules, newModule]);
    setExpanded(newModule.id);
  }, [modules, onChange]);

  const removeModule = useCallback(
    (moduleId: string) => {
      const updated = modules
        .filter(m => m.id !== moduleId)
        .map((m, idx) => ({ ...m, day: idx + 1 })); // Re-number days
      onChange(updated.length > 0 ? updated : null);
    },
    [modules, onChange]
  );

  const removeTopic = useCallback(
    (moduleId: string, topicId: string) => {
      onChange(
        modules.map(m =>
          m.id === moduleId
            ? { ...m, topics: m.topics.filter(t => t.id !== topicId) }
            : m
        )
      );
    },
    [modules, onChange]
  );

  const handleModuleDeleteClick = useCallback(
    (e: React.MouseEvent, moduleId: string, moduleTitle: string) => {
      e.stopPropagation();
      setDeleteDialog({
        open: true,
        type: 'module',
        moduleId,
        title: moduleTitle || `Tag`,
      });
    },
    []
  );

  const handleTopicDeleteClick = useCallback(
    (
      e: React.MouseEvent,
      moduleId: string,
      topicId: string,
      topicTitle: string
    ) => {
      e.stopPropagation();
      setDeleteDialog({
        open: true,
        type: 'topic',
        moduleId,
        topicId,
        title: topicTitle || 'Dieses Thema',
      });
    },
    []
  );

  const handleDeleteConfirm = useCallback(() => {
    if (!deleteDialog) return;
    try {
      if (deleteDialog.type === 'module') {
        removeModule(deleteDialog.moduleId);
      } else if (deleteDialog.topicId) {
        removeTopic(deleteDialog.moduleId, deleteDialog.topicId);
      }
    } finally {
      setDeleteDialog(null);
    }
  }, [deleteDialog, removeModule, removeTopic]);

  const handleDeleteCancel = useCallback(() => {
    setDeleteDialog(null);
  }, []);

  const updateModuleTitle = useCallback(
    (moduleId: string, title: string) => {
      onChange(modules.map(m => (m.id === moduleId ? { ...m, title } : m)));
    },
    [modules, onChange]
  );

  const addTopic = useCallback(
    (moduleId: string) => {
      onChange(
        modules.map(m =>
          m.id === moduleId
            ? { ...m, topics: [...m.topics, createEmptyTopic()] }
            : m
        )
      );
    },
    [modules, onChange]
  );

  const updateTopic = useCallback(
    (
      moduleId: string,
      topicId: string,
      field: 'timeRange' | 'title',
      topicValue: string
    ) => {
      onChange(
        modules.map(m =>
          m.id === moduleId
            ? {
                ...m,
                topics: m.topics.map(t =>
                  t.id === topicId ? { ...t, [field]: topicValue } : t
                ),
              }
            : m
        )
      );
    },
    [modules, onChange]
  );

  // Trim whitespace on blur for better UX
  const trimModuleTitle = useCallback(
    (moduleId: string) => {
      const module = modules.find(m => m.id === moduleId);
      if (module && module.title !== module.title.trim()) {
        updateModuleTitle(moduleId, module.title.trim());
      }
    },
    [modules, updateModuleTitle]
  );

  const trimTopic = useCallback(
    (moduleId: string, topicId: string, field: 'timeRange' | 'title') => {
      const module = modules.find(m => m.id === moduleId);
      const topic = module?.topics.find(t => t.id === topicId);
      if (topic && topic[field] !== topic[field].trim()) {
        updateTopic(moduleId, topicId, field, topic[field].trim());
      }
    },
    [modules, updateTopic]
  );

  return (
    <Box sx={{ mt: 2 }}>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 2,
        }}
      >
        <Typography variant='subtitle1' fontWeight='bold'>
          {TERMS.courseProgress}
        </Typography>
        <Button
          size='small'
          startIcon={<AddIcon />}
          onClick={addModule}
          disabled={disabled}
        >
          Tag hinzufügen
        </Button>
      </Box>

      {modules.length === 0 ? (
        <Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>
          Noch kein {TERMS.courseProgress} definiert. Klicke auf "Tag
          hinzufügen" um zu beginnen.
        </Typography>
      ) : (
        modules.map(module => (
          <Accordion
            key={module.id}
            expanded={expanded === module.id}
            onChange={handleAccordionChange(module.id)}
            sx={{ mb: 1 }}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant='subtitle2' sx={{ minWidth: 60 }}>
                Tag {module.day}
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              {/* Module header with editable title and delete button */}
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  mb: 2,
                  pb: 2,
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                }}
              >
                <TextField
                  size='small'
                  label='Titel'
                  value={module.title}
                  onChange={e => updateModuleTitle(module.id, e.target.value)}
                  onBlur={() => trimModuleTitle(module.id)}
                  onClick={e => e.stopPropagation()}
                  disabled={disabled}
                  placeholder='z.B. Grundlagen der Verhandlung'
                  sx={{ flexGrow: 1, bgcolor: 'white' }}
                />
                <IconButton
                  size='small'
                  color='error'
                  onClick={e =>
                    handleModuleDeleteClick(e, module.id, module.title)
                  }
                  disabled={disabled}
                  title='Tag löschen'
                >
                  <DeleteIcon fontSize='small' />
                </IconButton>
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {module.topics.map((topic, topicIndex) => (
                  <Box
                    key={topic.id}
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 0.5,
                      p: 1,
                      bgcolor: 'white',
                      borderRadius: 1,
                      border: '1px solid',
                      borderColor: 'grey.200',
                    }}
                  >
                    {/* Topic controls row */}
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                      }}
                    >
                      <Typography
                        variant='caption'
                        sx={{ minWidth: 24, color: 'text.secondary' }}
                      >
                        {topicIndex + 1}.
                      </Typography>
                      <TextField
                        size='small'
                        value={topic.timeRange}
                        onChange={e =>
                          updateTopic(
                            module.id,
                            topic.id,
                            'timeRange',
                            e.target.value
                          )
                        }
                        onBlur={() =>
                          trimTopic(module.id, topic.id, 'timeRange')
                        }
                        disabled={disabled}
                        placeholder='09:00 - 09:30'
                        sx={{ width: 140, bgcolor: 'white' }}
                      />
                      <TextField
                        size='small'
                        value={topic.title}
                        onChange={e =>
                          updateTopic(
                            module.id,
                            topic.id,
                            'title',
                            e.target.value
                          )
                        }
                        onBlur={() => trimTopic(module.id, topic.id, 'title')}
                        disabled={disabled}
                        placeholder='Thema / Aktivität'
                        sx={{ flexGrow: 1, bgcolor: 'white' }}
                      />
                      <IconButton
                        size='small'
                        color='error'
                        onClick={e =>
                          handleTopicDeleteClick(
                            e,
                            module.id,
                            topic.id,
                            topic.title
                          )
                        }
                        disabled={disabled || module.topics.length <= 1}
                      >
                        <DeleteIcon fontSize='small' />
                      </IconButton>
                    </Box>
                    {/* Material links for this topic */}
                    {courseId && (
                      <MaterialLinkSelector
                        courseId={courseId}
                        topicId={topic.id}
                        disabled={disabled}
                      />
                    )}
                  </Box>
                ))}
                <Button
                  size='small'
                  startIcon={<AddIcon />}
                  onClick={() => addTopic(module.id)}
                  disabled={disabled}
                  sx={{ alignSelf: 'flex-start', mt: 1 }}
                >
                  Thema hinzufügen
                </Button>
              </Box>
            </AccordionDetails>
          </Accordion>
        ))
      )}

      {/* Confirmation Dialog */}
      <Dialog
        open={deleteDialog?.open ?? false}
        onClose={handleDeleteCancel}
        aria-labelledby='delete-dialog-title'
        aria-describedby='delete-dialog-description'
      >
        <DialogTitle id='delete-dialog-title'>
          {deleteDialog?.type === 'module'
            ? `„${deleteDialog?.title}" löschen?`
            : `Thema „${deleteDialog?.title}" löschen?`}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id='delete-dialog-description'>
            {deleteDialog?.type === 'module'
              ? `Möchtest du den Tag „${deleteDialog?.title}" und alle zugehörigen Themen wirklich löschen?`
              : `Möchtest du das Thema „${deleteDialog?.title}" wirklich löschen?`}{' '}
            Diese Aktion kann nicht rückgängig gemacht werden.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={handleDeleteCancel}
            color='inherit'
            autoFocus
            aria-label='Löschen abbrechen'
          >
            Abbrechen
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            color='error'
            variant='contained'
            aria-label={`${deleteDialog?.title} endgültig löschen`}
          >
            Löschen
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
