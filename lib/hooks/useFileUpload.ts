/**
 * useFileUpload Hook
 * Feature: 030-extended-material-upload
 *
 * Shared file upload state and handlers used by HTMLContentUploadForm
 * and SlideControlUploadForm. Centralizes drag-and-drop handling,
 * file validation, file selection, and size formatting so both forms
 * stay aligned.
 */

'use client';

import { useCallback, useRef, useState } from 'react';
import {
  ALLOWED_FILE_EXTENSIONS,
  MAX_FILE_SIZE,
} from '@/lib/schemas/admin/course-material';

/** Format bytes into a human-readable string (B / KB / MB). */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export interface UseFileUploadOptions {
  /** When true, all selection/drag handlers short-circuit (e.g. during submit). */
  isLoading: boolean;
}

export interface UseFileUploadResult {
  selectedFile: File | null;
  dragOver: boolean;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  error: string | null;
  setError: (error: string | null) => void;
  setSelectedFile: (file: File | null) => void;
  validateFile: (file: File) => string | null;
  handleFileSelect: (file: File) => void;
  handleFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  handleDragOver: (event: React.DragEvent) => void;
  handleDragLeave: (event: React.DragEvent) => void;
  handleDrop: (event: React.DragEvent) => void;
  handleRemoveFile: () => void;
  handleBrowseClick: () => void;
}

/**
 * Shared file upload hook for .html drag-and-drop forms.
 * Returns state and handlers; the consuming component owns form-specific
 * UI, submit logic, and callbacks.
 */
export function useFileUpload(
  options: UseFileUploadOptions
): UseFileUploadResult {
  const { isLoading } = options;

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = useCallback((file: File): string | null => {
    const hasValidExtension = ALLOWED_FILE_EXTENSIONS.some(ext =>
      file.name.toLowerCase().endsWith(ext)
    );
    if (!hasValidExtension) {
      return 'Nur .html-Dateien sind erlaubt';
    }
    if (file.size > MAX_FILE_SIZE) {
      return `Datei darf maximal ${MAX_FILE_SIZE / 1024 / 1024} MB groß sein`;
    }
    return null;
  }, []);

  const handleFileSelect = useCallback(
    (file: File) => {
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        return;
      }
      setError(null);
      setSelectedFile(file);
    },
    [validateFile]
  );

  const handleFileChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
        handleFileSelect(file);
      }
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    [handleFileSelect]
  );

  const handleDragOver = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      if (isLoading) return;
      setDragOver(true);
    },
    [isLoading]
  );

  const handleDragLeave = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    setDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      setDragOver(false);
      if (isLoading) return;
      const file = event.dataTransfer.files?.[0];
      if (file) {
        handleFileSelect(file);
      }
    },
    [isLoading, handleFileSelect]
  );

  const handleRemoveFile = useCallback(() => {
    setSelectedFile(null);
  }, []);

  const handleBrowseClick = useCallback(() => {
    if (isLoading) return;
    fileInputRef.current?.click();
  }, [isLoading]);

  return {
    selectedFile,
    dragOver,
    fileInputRef,
    error,
    setError,
    setSelectedFile,
    validateFile,
    handleFileSelect,
    handleFileChange,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleRemoveFile,
    handleBrowseClick,
  };
}
