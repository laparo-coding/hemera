/**
 * SlideEditor Component
 * Feature: 023-slide-editor
 *
 * Tiptap WYSIWYG editor for seminar material HTML content.
 * Uses StarterKit, Image, Table, Link, Underline, Highlight extensions.
 * Supports image upload via Vercel Blob API.
 */

'use client';

import { Box, CircularProgress, Typography } from '@mui/material';
import { Highlight } from '@tiptap/extension-highlight';
import { Image } from '@tiptap/extension-image';
import { Link } from '@tiptap/extension-link';
import { Table } from '@tiptap/extension-table';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { TableRow } from '@tiptap/extension-table-row';
import { Underline } from '@tiptap/extension-underline';
import { EditorContent, useEditor } from '@tiptap/react';
import { StarterKit } from '@tiptap/starter-kit';
import { useCallback, useEffect, useRef } from 'react';
import { SlideEditorToolbar } from './SlideEditorToolbar';

interface SlideEditorProps {
  /** Initial HTML content */
  content?: string;
  /** Called when content changes (debounced) */
  onChange?: (html: string) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Disable editing */
  disabled?: boolean;
  /** Min height for the editor area */
  minHeight?: number;
}

export function SlideEditor({
  content = '',
  onChange,
  placeholder = 'Beginne mit der Eingabe...',
  disabled = false,
  minHeight = 400,
}: SlideEditorProps) {
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const editor = useEditor({
    // Prevent hydration mismatch with SSR
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3, 4],
        },
      }),
      Underline,
      Highlight.configure({
        multicolor: false,
      }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        HTMLAttributes: {
          rel: 'noopener noreferrer',
          target: '_blank',
        },
      }),
      Image.configure({
        inline: false,
        allowBase64: false,
        HTMLAttributes: {
          class: 'slide-editor-image',
        },
      }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content,
    editable: !disabled,
    onUpdate: ({ editor: ed }) => {
      onChangeRef.current?.(ed.getHTML());
    },
  });

  // Update editable state when disabled prop changes
  useEffect(() => {
    if (editor) {
      editor.setEditable(!disabled);
    }
  }, [editor, disabled]);

  const handleImageUpload = useCallback(async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('/api/admin/course-material/images', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      let errorMsg = 'Bild-Upload fehlgeschlagen';
      try {
        const data = await response.json();
        errorMsg = data.message || errorMsg;
      } catch {
        // Non-JSON response
      }
      throw new Error(errorMsg);
    }

    const data = await response.json();
    return data.url;
  }, []);

  if (!editor) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight,
          border: 1,
          borderColor: 'divider',
          borderRadius: 1,
        }}
      >
        <CircularProgress size={24} />
        <Typography variant='body2' sx={{ ml: 1 }}>
          Editor wird geladen...
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        border: 1,
        borderColor: disabled ? 'action.disabled' : 'divider',
        borderRadius: 1,
        overflow: 'hidden',
        '&:focus-within': {
          borderColor: disabled ? 'action.disabled' : 'primary.main',
          boxShadow: disabled
            ? 'none'
            : theme => `0 0 0 1px ${theme.palette.primary.main}`,
        },
      }}
    >
      <SlideEditorToolbar editor={editor} onImageUpload={handleImageUpload} />

      <Box
        sx={{
          minHeight,
          p: 2,
          '& .tiptap': {
            outline: 'none',
            minHeight: minHeight - 32,
            fontFamily: 'inherit',
            fontSize: '1rem',
            lineHeight: 1.6,
            color: 'text.primary',
          },
          '& .tiptap p.is-editor-empty:first-child::before': {
            content: `"${placeholder}"`,
            color: 'text.disabled',
            float: 'left',
            height: 0,
            pointerEvents: 'none',
          },
          // Headings
          '& .tiptap h1': {
            fontSize: '2rem',
            fontWeight: 700,
            mt: 3,
            mb: 1,
          },
          '& .tiptap h2': {
            fontSize: '1.5rem',
            fontWeight: 600,
            mt: 2.5,
            mb: 1,
          },
          '& .tiptap h3': {
            fontSize: '1.25rem',
            fontWeight: 600,
            mt: 2,
            mb: 0.5,
          },
          '& .tiptap h4': {
            fontSize: '1.1rem',
            fontWeight: 600,
            mt: 1.5,
            mb: 0.5,
          },
          // Blockquote
          '& .tiptap blockquote': {
            borderLeft: 3,
            borderColor: 'primary.light',
            pl: 2,
            ml: 0,
            color: 'text.secondary',
            fontStyle: 'italic',
          },
          // Code
          '& .tiptap code': {
            bgcolor: 'grey.100',
            px: 0.5,
            py: 0.25,
            borderRadius: 0.5,
            fontFamily: 'monospace',
            fontSize: '0.875em',
          },
          '& .tiptap pre': {
            bgcolor: 'grey.900',
            color: 'common.white',
            p: 2,
            borderRadius: 1,
            overflow: 'auto',
            '& code': {
              bgcolor: 'transparent',
              color: 'inherit',
              px: 0,
              py: 0,
            },
          },
          // Images
          '& .tiptap img.slide-editor-image': {
            maxWidth: '100%',
            height: 'auto',
            borderRadius: 1,
            my: 1,
          },
          // Tables
          '& .tiptap table': {
            borderCollapse: 'collapse',
            width: '100%',
            my: 2,
          },
          '& .tiptap th, & .tiptap td': {
            border: 1,
            borderColor: 'divider',
            p: 1,
            minWidth: 80,
          },
          '& .tiptap th': {
            bgcolor: 'grey.100',
            fontWeight: 600,
          },
          // Links
          '& .tiptap a': {
            color: 'primary.main',
            textDecoration: 'underline',
            cursor: 'pointer',
          },
          // Lists
          '& .tiptap ul, & .tiptap ol': {
            pl: 3,
          },
          '& .tiptap li': {
            mb: 0.5,
          },
          // Highlight
          '& .tiptap mark': {
            bgcolor: 'warning.light',
            px: 0.25,
            borderRadius: 0.25,
          },
          // Horizontal rule
          '& .tiptap hr': {
            border: 'none',
            borderTop: 1,
            borderColor: 'divider',
            my: 2,
          },
        }}
      >
        <EditorContent editor={editor} />
      </Box>
    </Box>
  );
}
