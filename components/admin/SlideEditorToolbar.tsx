/**
 * SlideEditor Toolbar Component
 * Feature: 023-slide-editor
 *
 * MUI-styled toolbar for Tiptap WYSIWYG editor
 * Provides formatting, structure, and media controls
 */

'use client';

import {
  Code as CodeIcon,
  FormatBold as FormatBoldIcon,
  FormatItalic as FormatItalicIcon,
  FormatListBulleted as FormatListBulletedIcon,
  FormatListNumbered as FormatListNumberedIcon,
  FormatQuote as FormatQuoteIcon,
  FormatStrikethrough as FormatStrikethroughIcon,
  FormatUnderlined as FormatUnderlinedIcon,
  Highlight as HighlightIcon,
  Image as ImageIcon,
  InsertLink as InsertLinkIcon,
  Redo as RedoIcon,
  TableChart as TableChartIcon,
  Title as TitleIcon,
  Undo as UndoIcon,
} from '@mui/icons-material';
import {
  Box,
  Divider,
  IconButton,
  Menu,
  MenuItem,
  Tooltip,
} from '@mui/material';
import type { Editor } from '@tiptap/react';
import { useCallback, useRef, useState } from 'react';

interface SlideEditorToolbarProps {
  editor: Editor | null;
  onImageUpload?: (file: File) => Promise<string>;
}

function ToolbarButton({
  onClick,
  isActive = false,
  disabled = false,
  title,
  children,
}: {
  onClick: (event: React.MouseEvent<HTMLElement>) => void;
  isActive?: boolean;
  disabled?: boolean;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Tooltip title={title}>
      <span>
        <IconButton
          size='small'
          onClick={onClick}
          disabled={disabled}
          sx={{
            color: isActive ? 'primary.main' : 'text.secondary',
            bgcolor: isActive ? 'action.selected' : 'transparent',
            '&:hover': {
              bgcolor: isActive ? 'action.selected' : 'action.hover',
            },
          }}
        >
          {children}
        </IconButton>
      </span>
    </Tooltip>
  );
}

export function SlideEditorToolbar({
  editor,
  onImageUpload,
}: SlideEditorToolbarProps) {
  const [headingAnchor, setHeadingAnchor] = useState<null | HTMLElement>(null);
  const [tableAnchor, setTableAnchor] = useState<null | HTMLElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleHeadingClick = useCallback(
    (event: React.MouseEvent<HTMLElement>) => {
      setHeadingAnchor(event.currentTarget);
    },
    []
  );

  const handleHeadingClose = useCallback(() => {
    setHeadingAnchor(null);
  }, []);

  const handleTableClick = useCallback(
    (event: React.MouseEvent<HTMLElement>) => {
      setTableAnchor(event.currentTarget);
    },
    []
  );

  const handleTableClose = useCallback(() => {
    setTableAnchor(null);
  }, []);

  const setHeading = useCallback(
    (level: 1 | 2 | 3 | 4) => {
      editor?.chain().focus().toggleHeading({ level }).run();
      handleHeadingClose();
    },
    [editor, handleHeadingClose]
  );

  const handleImageSelect = useCallback(async () => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file || !onImageUpload || !editor) return;

      try {
        const url = await onImageUpload(file);
        editor.chain().focus().setImage({ src: url, alt: file.name }).run();
      } catch (error) {
        // biome-ignore lint/suspicious/noConsole: Bild-Upload-Fehler müssen sichtbar sein
        console.error('Bild-Upload fehlgeschlagen:', error);
      }

      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    [editor, onImageUpload]
  );

  const addLink = useCallback(() => {
    if (!editor) return;

    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('URL eingeben:', previousUrl || 'https://');

    if (url === null) return; // cancelled

    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }, [editor]);

  const insertTable = useCallback(() => {
    editor
      ?.chain()
      .focus()
      .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
      .run();
    handleTableClose();
  }, [editor, handleTableClose]);

  const addTableRow = useCallback(() => {
    editor?.chain().focus().addRowAfter().run();
    handleTableClose();
  }, [editor, handleTableClose]);

  const addTableColumn = useCallback(() => {
    editor?.chain().focus().addColumnAfter().run();
    handleTableClose();
  }, [editor, handleTableClose]);

  const deleteTable = useCallback(() => {
    editor?.chain().focus().deleteTable().run();
    handleTableClose();
  }, [editor, handleTableClose]);

  if (!editor) return null;

  return (
    <Box
      sx={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: 0.25,
        px: 1,
        py: 0.5,
        borderBottom: 1,
        borderColor: 'divider',
        bgcolor: 'grey.50',
      }}
    >
      {/* Undo/Redo */}
      <ToolbarButton
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
        title='Rückgängig'
      >
        <UndoIcon fontSize='small' />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
        title='Wiederholen'
      >
        <RedoIcon fontSize='small' />
      </ToolbarButton>

      <Divider orientation='vertical' flexItem sx={{ mx: 0.5 }} />

      {/* Headings */}
      <ToolbarButton
        onClick={handleHeadingClick}
        isActive={editor.isActive('heading')}
        title='Überschrift'
      >
        <TitleIcon fontSize='small' />
      </ToolbarButton>
      <Menu
        anchorEl={headingAnchor}
        open={Boolean(headingAnchor)}
        onClose={handleHeadingClose}
      >
        <MenuItem
          onClick={() => setHeading(1)}
          selected={editor.isActive('heading', { level: 1 })}
        >
          Überschrift 1
        </MenuItem>
        <MenuItem
          onClick={() => setHeading(2)}
          selected={editor.isActive('heading', { level: 2 })}
        >
          Überschrift 2
        </MenuItem>
        <MenuItem
          onClick={() => setHeading(3)}
          selected={editor.isActive('heading', { level: 3 })}
        >
          Überschrift 3
        </MenuItem>
        <MenuItem
          onClick={() => setHeading(4)}
          selected={editor.isActive('heading', { level: 4 })}
        >
          Überschrift 4
        </MenuItem>
        <MenuItem
          onClick={() => {
            editor.chain().focus().setParagraph().run();
            handleHeadingClose();
          }}
        >
          Normal
        </MenuItem>
      </Menu>

      <Divider orientation='vertical' flexItem sx={{ mx: 0.5 }} />

      {/* Text formatting */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBold().run()}
        isActive={editor.isActive('bold')}
        title='Fett'
      >
        <FormatBoldIcon fontSize='small' />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleItalic().run()}
        isActive={editor.isActive('italic')}
        title='Kursiv'
      >
        <FormatItalicIcon fontSize='small' />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        isActive={editor.isActive('underline')}
        title='Unterstrichen'
      >
        <FormatUnderlinedIcon fontSize='small' />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleStrike().run()}
        isActive={editor.isActive('strike')}
        title='Durchgestrichen'
      >
        <FormatStrikethroughIcon fontSize='small' />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHighlight().run()}
        isActive={editor.isActive('highlight')}
        title='Hervorheben'
      >
        <HighlightIcon fontSize='small' />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleCode().run()}
        isActive={editor.isActive('code')}
        title='Code'
      >
        <CodeIcon fontSize='small' />
      </ToolbarButton>

      <Divider orientation='vertical' flexItem sx={{ mx: 0.5 }} />

      {/* Lists */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        isActive={editor.isActive('bulletList')}
        title='Aufzählung'
      >
        <FormatListBulletedIcon fontSize='small' />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        isActive={editor.isActive('orderedList')}
        title='Nummerierte Liste'
      >
        <FormatListNumberedIcon fontSize='small' />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        isActive={editor.isActive('blockquote')}
        title='Zitat'
      >
        <FormatQuoteIcon fontSize='small' />
      </ToolbarButton>

      <Divider orientation='vertical' flexItem sx={{ mx: 0.5 }} />

      {/* Link */}
      <ToolbarButton
        onClick={addLink}
        isActive={editor.isActive('link')}
        title='Link'
      >
        <InsertLinkIcon fontSize='small' />
      </ToolbarButton>

      {/* Image */}
      {onImageUpload && (
        <ToolbarButton onClick={handleImageSelect} title='Bild einfügen'>
          <ImageIcon fontSize='small' />
        </ToolbarButton>
      )}

      {/* Table */}
      <ToolbarButton
        onClick={handleTableClick}
        isActive={editor.isActive('table')}
        title='Tabelle'
      >
        <TableChartIcon fontSize='small' />
      </ToolbarButton>
      <Menu
        anchorEl={tableAnchor}
        open={Boolean(tableAnchor)}
        onClose={handleTableClose}
      >
        <MenuItem onClick={insertTable}>Tabelle einfügen (3×3)</MenuItem>
        <MenuItem onClick={addTableRow} disabled={!editor.isActive('table')}>
          Zeile hinzufügen
        </MenuItem>
        <MenuItem onClick={addTableColumn} disabled={!editor.isActive('table')}>
          Spalte hinzufügen
        </MenuItem>
        <MenuItem onClick={deleteTable} disabled={!editor.isActive('table')}>
          Tabelle löschen
        </MenuItem>
      </Menu>

      {/* Hidden file input for images */}
      <input
        type='file'
        ref={fileInputRef}
        onChange={handleFileChange}
        accept='image/jpeg,image/png,image/webp,image/gif'
        style={{ display: 'none' }}
        aria-label='Bild hochladen'
      />
    </Box>
  );
}
