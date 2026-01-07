import { useCallback, useRef } from 'react';
import { useConverter } from '../context/ConverterContext';
import { convertImage } from '../utils/converter';
import toast from 'react-hot-toast';

export const useImageConverter = () => {
  const { state, dispatch } = useConverter();
  const { files, options, isConverting } = state;
  const abortRef = useRef(false);

  /**
   * Process files ONE BY ONE (sequential) to prevent memory issues
   * This is intentional for a free service to avoid overloading browsers
   */
  const convertAll = useCallback(async () => {
    const pendingFiles = files.filter((f) => f.status === 'pending' || f.status === 'error');

    if (pendingFiles.length === 0) {
      toast.error('No files to convert');
      return;
    }

    dispatch({ type: 'SET_CONVERTING', payload: true });
    abortRef.current = false;

    let successCount = 0;
    let errorCount = 0;

    // Process ONE BY ONE to prevent memory issues
    for (const selectedFile of pendingFiles) {
      // Check if conversion was cancelled
      if (abortRef.current) {
        toast('Conversion cancelled', { icon: '⚠️' });
        break;
      }

      dispatch({
        type: 'UPDATE_FILE',
        payload: { id: selectedFile.id, updates: { status: 'converting', progress: 20 } },
      });

      try {
        // Small delay to allow UI to update and prevent blocking
        await new Promise(resolve => setTimeout(resolve, 50));
        
        dispatch({
          type: 'UPDATE_FILE',
          payload: { id: selectedFile.id, updates: { progress: 50 } },
        });

        const result = await convertImage(selectedFile.file, options);

        dispatch({
          type: 'UPDATE_FILE',
          payload: {
            id: selectedFile.id,
            updates: { status: 'completed', progress: 100, result },
          },
        });
        successCount++;
        
        // Brief pause between conversions to free up memory
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Conversion failed';
        dispatch({
          type: 'UPDATE_FILE',
          payload: {
            id: selectedFile.id,
            updates: { status: 'error', progress: 0, error: errorMessage },
          },
        });
        errorCount++;
      }
    }

    dispatch({ type: 'SET_CONVERTING', payload: false });

    if (successCount > 0) {
      toast.success(`Successfully converted ${successCount} file(s)`);
    }
    if (errorCount > 0) {
      toast.error(`Failed to convert ${errorCount} file(s)`);
    }
  }, [files, options, dispatch]);

  const cancelConversion = useCallback(() => {
    abortRef.current = true;
  }, []);

  const convertSingle = useCallback(
    async (fileId: string) => {
      const selectedFile = files.find((f) => f.id === fileId);
      if (!selectedFile) return;

      dispatch({
        type: 'UPDATE_FILE',
        payload: { id: fileId, updates: { status: 'converting', progress: 10 } },
      });

      try {
        dispatch({
          type: 'UPDATE_FILE',
          payload: { id: fileId, updates: { progress: 50 } },
        });

        const result = await convertImage(selectedFile.file, options);

        dispatch({
          type: 'UPDATE_FILE',
          payload: {
            id: fileId,
            updates: { status: 'completed', progress: 100, result },
          },
        });
        toast.success(`Converted ${selectedFile.file.name}`);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Conversion failed';
        dispatch({
          type: 'UPDATE_FILE',
          payload: {
            id: fileId,
            updates: { status: 'error', progress: 0, error: errorMessage },
          },
        });
        toast.error(`Failed to convert ${selectedFile.file.name}`);
      }
    },
    [files, options, dispatch]
  );

  return {
    convertAll,
    convertSingle,
    cancelConversion,
    isConverting,
    options,
  };
};
