/**
 * Shared domain types for course material creation.
 *
 * Decoupled from UI components so API/client logic can reference
 * MaterialCreationMode without pulling in component code.
 */

/**
 * Creation mode for materials.
 * - 'CONTENT_UPLOAD': Upload HTML file as CONTENT material (Feature 030)
 * - 'CONTENT_EDITOR': Create content via WYSIWYG editor (Feature 026)
 * - 'SLIDE_CONTROL': Upload slide control HTML file (Feature 026)
 */
export type MaterialCreationMode =
  | 'CONTENT_UPLOAD'
  | 'CONTENT_EDITOR'
  | 'SLIDE_CONTROL';
