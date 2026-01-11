import { useCallback } from 'react';
import { useConverter } from '../context/ConverterContext';
import { SelectedFile } from '../types';
import { generateId } from '../utils/converter';
import { createPreviewUrl, revokePreviewUrl, isSupportedFormat } from '../utils/fileUtils';
import { MAX_FILES, MAX_FILE_SIZE } from '../constants';
import toast from 'react-hot-toast';

export const useFileSelection = () => {
  const { state, dispatch } = useConverter();
  const { files } = state;

  const addFiles = useCallback(
    (newFiles: File[]) => {
      const currentCount = files.length;
      const availableSlots = MAX_FILES - currentCount;

      if (availableSlots <= 0) {
        toast.error(`Maximum ${MAX_FILES} files allowed`);
        return;
      }

      const filesToAdd = newFiles.slice(0, availableSlots);
      const skipped = newFiles.length - filesToAdd.length;

      const validFiles: SelectedFile[] = [];
      const errors: string[] = [];

      filesToAdd.forEach((file) => {
        // Check format
        if (!isSupportedFormat(file)) {
          errors.push(`${file.name}: Unsupported format`);
          return;
        }

        // Check size
        if (file.size > MAX_FILE_SIZE) {
          errors.push(`${file.name}: Exceeds 50MB limit`);
          return;
        }

        validFiles.push({
          id: generateId(),
          file,
          preview: createPreviewUrl(file),
          status: 'pending',
          progress: 0,
        });
      });

      if (validFiles.length > 0) {
        dispatch({ type: 'ADD_FILES', payload: validFiles });
        toast.success(`Added ${validFiles.length} file(s)`);
      }

      if (errors.length > 0) {
        errors.forEach((err) => toast.error(err));
      }

      if (skipped > 0) {
        toast.error(`${skipped} file(s) skipped: Maximum ${MAX_FILES} files allowed`);
      }
    },
    [files.length, dispatch]
  );

  const removeFile = useCallback(
    (id: string) => {
      const file = files.find((f) => f.id === id);
      if (file) {
        revokePreviewUrl(file.preview);
        if (file.result?.blob) {
          URL.revokeObjectURL(URL.createObjectURL(file.result.blob));
        }
      }
      dispatch({ type: 'REMOVE_FILE', payload: id });
    },
    [files, dispatch]
  );

  const clearFiles = useCallback(() => {
    // Clean up all preview URLs
    files.forEach((file) => {
      revokePreviewUrl(file.preview);
    });
    dispatch({ type: 'CLEAR_FILES' });
    toast.success('All files cleared');
  }, [files, dispatch]);

  const toggleFileSelection = useCallback(
    (id: string) => {
      const file = files.find((f) => f.id === id);
      if (file) {
        dispatch({
          type: 'UPDATE_FILE',
          payload: { id, updates: { selected: !file.selected } },
        });
      }
    },
    [files, dispatch]
  );

  const selectAll = useCallback(() => {
    files.forEach((file) => {
      dispatch({
        type: 'UPDATE_FILE',
        payload: { id: file.id, updates: { selected: true } },
      });
    });
  }, [files, dispatch]);

  const deselectAll = useCallback(() => {
    files.forEach((file) => {
      dispatch({
        type: 'UPDATE_FILE',
        payload: { id: file.id, updates: { selected: false } },
      });
    });
  }, [files, dispatch]);

  const totalSize = files.reduce((acc, f) => acc + f.file.size, 0);
  const pendingFiles = files.filter((f) => f.status === 'pending');
  const completedFiles = files.filter((f) => f.status === 'completed');
  const errorFiles = files.filter((f) => f.status === 'error');
  const selectedFiles = files.filter((f) => f.selected && (f.status === 'pending' || f.status === 'error'));

  return {
    files,
    addFiles,
    removeFile,
    clearFiles,
    toggleFileSelection,
    selectAll,
    deselectAll,
    totalSize,
    pendingFiles,
    completedFiles,
    errorFiles,
    selectedFiles,
    fileCount: files.length,
    isAtLimit: files.length >= MAX_FILES,
  };
};
