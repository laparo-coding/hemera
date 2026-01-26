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
  IconButton,
  TextField,
  Typography,
} from '@mui/material';
import { useCallback, useState } from 'react';
import { TERMS } from '../../lib/constants/terminology';
import type {
  CurriculumModule,
  CurriculumTopic,
} from '../../lib/schemas/admin/course';

interface CurriculumEditorProps {
  value: CurriculumModule[] | null | undefined;
  onChange: (curriculum: CurriculumModule[] | null) => void;
  disabled?: boolean;
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
}: CurriculumEditorProps) {
  // Normalize value to empty array if null/undefined
  const modules: CurriculumModule[] = value ?? [];

  const [expanded, setExpanded] = useState<string | false>(
    modules[0]?.id ?? false
  );

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
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  width: '100%',
                  pr: 2,
                }}
              >
                <Typography variant='subtitle2' sx={{ minWidth: 60 }}>
                  Tag {module.day}
                </Typography>
                <TextField
                  size='small'
                  value={module.title}
                  onChange={e => updateModuleTitle(module.id, e.target.value)}
                  onClick={e => e.stopPropagation()}
                  disabled={disabled}
                  placeholder='Titel des Tages'
                  sx={{ flexGrow: 1 }}
                />
                <IconButton
                  size='small'
                  color='error'
                  onClick={e => {
                    e.stopPropagation();
                    removeModule(module.id);
                  }}
                  disabled={disabled}
                >
                  <DeleteIcon fontSize='small' />
                </IconButton>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {module.topics.map((topic, topicIndex) => (
                  <Box
                    key={topic.id}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      p: 1,
                      bgcolor: 'grey.50',
                      borderRadius: 1,
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
                      disabled={disabled}
                      placeholder='09:00 - 09:30'
                      sx={{ width: 140 }}
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
                      disabled={disabled}
                      placeholder='Thema / Aktivität'
                      sx={{ flexGrow: 1 }}
                    />
                    <IconButton
                      size='small'
                      color='error'
                      onClick={() => removeTopic(module.id, topic.id)}
                      disabled={disabled || module.topics.length <= 1}
                    >
                      <DeleteIcon fontSize='small' />
                    </IconButton>
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
    </Box>
  );
}
