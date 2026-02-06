import { useCallback } from 'react';
import { useConverter } from '../context/ConverterContext';
import { SelectedFile } from '../types';
import { generateId } from '../utils/converter';
import { createPreviewUrl, revokePreviewUrl, getFileExtension } from '../utils/fileUtils';
import { ACCEPTED_FILE_TYPES, MAX_FILES, MAX_FILE_SIZE, MAX_TOTAL_SIZE } from '../constants';
import toast from 'react-hot-toast';

const revokeDisplayPreview = (file: SelectedFile) => {
  if (file.displayPreview && file.displayPreview !== file.preview && file.displayPreview.startsWith('blob:')) {
    URL.revokeObjectURL(file.displayPreview);
  }
};

export const useFileSelection = () => {
  const { state, dispatch } = useConverter();
  const { files } = state;

  const addFiles = useCallback(
    (newFiles: File[]) => {
      const currentCount = files.length;
      const availableSlots = MAX_FILES - currentCount;
      let runningTotalSize = files.reduce((acc, f) => acc + f.file.size, 0);

      if (availableSlots <= 0) {
        toast.error(`Maximum ${MAX_FILES} files allowed`);
        return;
      }

      const filesToAdd = newFiles.slice(0, availableSlots);
      const skipped = newFiles.length - filesToAdd.length;

      const validFiles: SelectedFile[] = [];
      const errorCounts = {
        unsupported: 0,
        tooLarge: 0,
        totalSize: 0,
        empty: 0,
      };

      const supportedMimeTypes = new Set(Object.keys(ACCEPTED_FILE_TYPES).map((t) => t.toLowerCase()));
      const supportedExtensions = new Set(
        Object.values(ACCEPTED_FILE_TYPES)
          .flat()
          .map((ext) => ext.replace('.', '').toLowerCase())
      );

      const isFileSupported = (file: File) => {
        if (file.type && supportedMimeTypes.has(file.type.toLowerCase())) {
          return true;
        }
        const extension = getFileExtension(file.name);
        return supportedExtensions.has(extension);
      };

      filesToAdd.forEach((file) => {
        // Check format
        if (!isFileSupported(file)) {
          errorCounts.unsupported += 1;
          return;
        }

        // Check size
        if (file.size === 0) {
          errorCounts.empty += 1;
          return;
        }

        if (file.size > MAX_FILE_SIZE) {
          errorCounts.tooLarge += 1;
          return;
        }

        // Check total size limit
        if (runningTotalSize + file.size > MAX_TOTAL_SIZE) {
          errorCounts.totalSize += 1;
          return;
        }

        runningTotalSize += file.size;

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

      if (errorCounts.unsupported > 0) {
        toast.error(`${errorCounts.unsupported} file(s) skipped: unsupported format`);
      }
      if (errorCounts.empty > 0) {
        toast.error(`${errorCounts.empty} file(s) skipped: empty or unreadable`);
      }
      if (errorCounts.tooLarge > 0) {
        toast.error(`${errorCounts.tooLarge} file(s) skipped: exceeds 50MB limit`);
      }
      if (errorCounts.totalSize > 0) {
        toast.error(
          `${errorCounts.totalSize} file(s) skipped: exceeds total ${Math.round(MAX_TOTAL_SIZE / (1024 * 1024))} MB limit`
        );
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
        revokeDisplayPreview(file);
      }
      dispatch({ type: 'REMOVE_FILE', payload: id });
    },
    [files, dispatch]
  );

  const clearFiles = useCallback(() => {
    // Clean up all preview URLs
    files.forEach((file) => {
      revokePreviewUrl(file.preview);
      revokeDisplayPreview(file);
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

  const moveFile = useCallback(
    (sourceId: string, targetId: string) => {
      dispatch({ type: 'MOVE_FILE', payload: { sourceId, targetId } });
    },
    [dispatch]
  );

  const moveFileByOffset = useCallback(
    (fileId: string, offset: number) => {
      const index = files.findIndex((f) => f.id === fileId);
      if (index === -1) return;
      const targetIndex = index + offset;
      if (targetIndex < 0 || targetIndex >= files.length) return;
      dispatch({
        type: 'MOVE_FILE',
        payload: { sourceId: fileId, targetId: files[targetIndex].id },
      });
    },
    [files, dispatch]
  );

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
    moveFile,
    moveFileByOffset,
    totalSize,
    pendingFiles,
    completedFiles,
    errorFiles,
    selectedFiles,
    fileCount: files.length,
    isAtLimit: files.length >= MAX_FILES,
  };
};
