import { useCallback, useRef, useEffect } from 'react';
import { useConverter } from '../context/ConverterContext';
import { convertImage, isHeicFile, convertHeicToBlob, isWorkerSupported } from '../utils/converter';
import { addToHistory } from '../utils/history';
import { ConvertResult } from '../types';
import { CONVERSION_DELAY_MS, UI_UPDATE_DELAY_MS } from '../constants';
import toast from 'react-hot-toast';

/**
 * Custom hook for image conversion operations
 * Manages Web Worker initialization, conversion queue, and progress tracking
 * @returns Conversion functions and state
 */
export const useImageConverter = () => {
  const { state, dispatch } = useConverter();
  const { files, options, isConverting } = state;
  const abortRef = useRef(false);
  const workerRef = useRef<Worker | null>(null);
  const useWorker = useRef(isWorkerSupported());

  // Initialize worker
  useEffect(() => {
    if (useWorker.current) {
      try {
        workerRef.current = new Worker(
          new URL('../workers/converter.worker.ts', import.meta.url),
          { type: 'module' }
        );
      } catch (error) {
        console.warn('Failed to initialize Web Worker, falling back to main thread:', error);
        useWorker.current = false;
      }
    }

    return () => {
      workerRef.current?.terminate();
    };
  }, []);

  /**
   * Convert using Web Worker (if supported)
   * Handles HEIC preprocessing on main thread (required) then sends to worker
   * @param file - The file to convert
   * @param fileId - Unique identifier for progress tracking
   * @returns Promise resolving to conversion result
   */
  const convertWithWorker = useCallback(
    async (file: File, fileId: string): Promise<ConvertResult> => {
      return new Promise(async (resolve, reject) => {
        if (!workerRef.current) {
          reject(new Error('Worker not available'));
          return;
        }

        // Preprocess HEIC if needed (HEIC conversion must happen on main thread)
        let blob: Blob = file;
        if (isHeicFile(file)) {
          try {
            blob = await convertHeicToBlob(file);
          } catch (error) {
            reject(error);
            return;
          }
        }

        const worker = workerRef.current;

        const handleMessage = (e: MessageEvent) => {
          const { type, payload, error, progress } = e.data;

          if (type === 'progress' && progress !== undefined) {
            dispatch({
              type: 'UPDATE_FILE',
              payload: { id: fileId, updates: { progress } },
            });
          } else if (type === 'success' && payload) {
            worker.removeEventListener('message', handleMessage);
            resolve(payload);
          } else if (type === 'error') {
            worker.removeEventListener('message', handleMessage);
            reject(new Error(error || 'Worker conversion failed'));
          }
        };

        worker.addEventListener('message', handleMessage);

        // Send to worker
        worker.postMessage({
          type: 'convert',
          payload: {
            blob,
            filename: file.name,
            originalSize: file.size,
            options,
          },
        });
      });
    },
    [options, dispatch]
  );

  /**
   * Process files ONE BY ONE (sequential) to prevent memory issues
   * This is intentional to avoid browser memory overload on free service
   * Shows progress updates for each file individually
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
        // Small delay to allow UI to update and prevent UI_UPDATE_DELAY_MSocking
        await new Promise(resolve => setTimeout(resolve, 50));
        
        let result: ConvertResult;
        
        // Use Web Worker if available, otherwise fall back to main thread
        if (useWorker.current && workerRef.current) {
          result = await convertWithWorker(selectedFile.file, selectedFile.id);
        } else {
          dispatch({
            type: 'UPDATE_FILE',
            payload: { id: selectedFile.id, updates: { progress: 50 } },
          });
          result = await convertImage(selectedFile.file, options);
        }

        dispatch({
          type: 'UPDATE_FILE',
          payload: {
            id: selectedFile.id,
            updates: { status: 'completed', progress: 100, result },
          },
        });
        
        // Save to history
        addToHistory({
          filename: result.filename,
          originalSize: result.originalSize,
          convertedSize: result.convertedSize,
          reduction: result.reduction,
          format: options.outputFormat || 'webp',
          quality: options.quality,
        });
        
        successCount++;
        
        // Brief pause between conversions to free up memCONVERSION_DELAY_MS
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
  }, [files, options, dispatch, convertWithWorker]);

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
        let result: ConvertResult;
        
        // Use Web Worker if available, otherwise fall back to main thread
        if (useWorker.current && workerRef.current) {
          result = await convertWithWorker(selectedFile.file, fileId);
        } else {
          dispatch({
            type: 'UPDATE_FILE',
            payload: { id: fileId, updates: { progress: 50 } },
          });
          result = await convertImage(selectedFile.file, options);
        }

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
    [files, options, dispatch, convertWithWorker]
  );

  return {
    convertAll,
    convertSingle,
    cancelConversion,
    isConverting,
    options,
    useWorker: useWorker.current,
  };
};
