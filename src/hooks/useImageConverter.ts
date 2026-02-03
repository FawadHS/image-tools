import { useCallback, useRef, useEffect } from 'react';
import { useConverter } from '../context/ConverterContext';
import { convertImage, isHeicFile, convertHeicToBlob, isWorkerSupported } from '../utils/converter';
import { addToHistory } from '../utils/history';
import { logConversion } from '../lib/conversionApi';
import { ConvertResult } from '../types';
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
  const conversionIdRef = useRef(0);
  const pendingRejectRef = useRef<((error: Error) => void) | null>(null);
  const workerRef = useRef<Worker | null>(null);
  // Web Worker now uses unified pipeline (renderEditsToOffscreenCanvas)
  // matching the exact transformation order of main thread
  const useWorker = useRef(isWorkerSupported());

  const ensureWorker = useCallback(() => {
    if (!useWorker.current) return null;
    if (workerRef.current) return workerRef.current;
    try {
      workerRef.current = new Worker(
        new URL('../workers/converter.worker.ts', import.meta.url),
        { type: 'module' }
      );
      return workerRef.current;
    } catch (error) {
      console.warn('Failed to initialize Web Worker, falling back to main thread:', error);
      useWorker.current = false;
      return null;
    }
  }, []);

  // Initialize worker
  useEffect(() => {
    ensureWorker();
    return () => {
      workerRef.current?.terminate();
      workerRef.current = null;
    };
  }, [ensureWorker]);

  /**
   * Convert using Web Worker (if supported)
   * Handles HEIC preprocessing on main thread (required) then sends to worker
   * @param file - The file to convert
   * @param fileId - Unique identifier for progress tracking
   * @returns Promise resolving to conversion result
   */
  const convertWithWorker = useCallback(
    async (file: File, fileId: string, fileTransform: any, runId: number): Promise<ConvertResult> => {
      return new Promise(async (resolve, reject) => {
        const workerInstance = ensureWorker();
        if (!workerInstance) {
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

        const worker = workerInstance;

        const handleMessage = (e: MessageEvent) => {
          if (runId !== conversionIdRef.current || abortRef.current) {
            worker.removeEventListener('message', handleMessage);
            pendingRejectRef.current = null;
            reject(new Error('Conversion cancelled'));
            return;
          }
          const { type, payload, error, progress } = e.data;

          if (type === 'progress' && progress !== undefined) {
            dispatch({
              type: 'UPDATE_FILE',
              payload: { id: fileId, updates: { progress } },
            });
          } else if (type === 'success' && payload) {
            worker.removeEventListener('message', handleMessage);
            pendingRejectRef.current = null;
            resolve(payload);
          } else if (type === 'error') {
            worker.removeEventListener('message', handleMessage);
            pendingRejectRef.current = null;
            reject(new Error(error || 'Worker conversion failed'));
          }
        };

        worker.addEventListener('message', handleMessage);
        pendingRejectRef.current = reject;

        // Send to worker with file-specific transform
        worker.postMessage({
          type: 'convert',
          payload: {
            blob,
            filename: file.name,
            originalSize: file.size,
            options: {
              ...options,
              transform: fileTransform, // Use file-specific transform
            },
          },
        });
      });
    },
    [options, dispatch, ensureWorker]
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
    const runId = ++conversionIdRef.current;

    let successCount = 0;
    let errorCount = 0;
    let cancelled = false;

    // Process ONE BY ONE to prevent memory issues
    for (const selectedFile of pendingFiles) {
      // Check if conversion was cancelled
      if (abortRef.current || runId !== conversionIdRef.current) {
        toast('Conversion cancelled');
        cancelled = true;
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
        if (useWorker.current) {
          result = await convertWithWorker(selectedFile.file, selectedFile.id, selectedFile.transform, runId);
        } else {
          dispatch({
            type: 'UPDATE_FILE',
            payload: { id: selectedFile.id, updates: { progress: 50 } },
          });
          result = await convertImage(selectedFile.file, {
            ...options,
            transform: selectedFile.transform, // Use file-specific transform
          });
        }

        if (abortRef.current || runId !== conversionIdRef.current) {
          dispatch({
            type: 'UPDATE_FILE',
            payload: { id: selectedFile.id, updates: { status: 'pending', progress: 0 } },
          });
          cancelled = true;
          break;
        }

        dispatch({
          type: 'UPDATE_FILE',
          payload: {
            id: selectedFile.id,
            updates: { status: 'completed', progress: 100, result },
          },
        });
        
        // Increment total conversions counter
        dispatch({
          type: 'INCREMENT_CONVERSIONS',
          payload: 1,
        });
        
        // Log conversion to backend (if user is authenticated)
        logConversion({
          action: 'convert',
          fileCount: 1,
          inputSize: result.originalSize,
          outputSize: result.convertedSize,
          inputFormat: selectedFile.file.type,
          outputFormat: options.outputFormat || 'webp',
        }).catch(() => {
          // Silent fail - don't disrupt user experience
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
        if (error instanceof Error && error.message === 'Conversion cancelled') {
          dispatch({
            type: 'UPDATE_FILE',
            payload: { id: selectedFile.id, updates: { status: 'pending', progress: 0 } },
          });
          cancelled = true;
          break;
        }
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

    if (cancelled) {
      return;
    }

    if (successCount > 0) {
      toast.success(`Successfully converted ${successCount} file(s)`);
    }
    if (errorCount > 0) {
      toast.error(`Failed to convert ${errorCount} file(s)`);
    }
  }, [files, options, dispatch, convertWithWorker]);

  /**
   * Convert only selected files
   * Similar to convertAll but only processes files with selected=true
   */
  const convertSelected = useCallback(async () => {
    const selectedFiles = files.filter((f) => f.selected && (f.status === 'pending' || f.status === 'error'));

    if (selectedFiles.length === 0) {
      toast.error('No files selected for conversion');
      return;
    }

    dispatch({ type: 'SET_CONVERTING', payload: true });
    abortRef.current = false;
    const runId = ++conversionIdRef.current;

    let successCount = 0;
    let errorCount = 0;
    let cancelled = false;

    // Process ONE BY ONE to prevent memory issues
    for (const selectedFile of selectedFiles) {
      // Check if conversion was cancelled
      if (abortRef.current || runId !== conversionIdRef.current) {
        toast('Conversion cancelled');
        cancelled = true;
        break;
      }

      dispatch({
        type: 'UPDATE_FILE',
        payload: { id: selectedFile.id, updates: { status: 'converting', progress: 20 } },
      });

      try {
        // Small delay to allow UI to update
        await new Promise(resolve => setTimeout(resolve, 50));
        
        let result: ConvertResult;
        
        // Use Web Worker if available, otherwise fall back to main thread
        if (useWorker.current) {
          result = await convertWithWorker(selectedFile.file, selectedFile.id, selectedFile.transform, runId);
        } else {
          dispatch({
            type: 'UPDATE_FILE',
            payload: { id: selectedFile.id, updates: { progress: 50 } },
          });
          result = await convertImage(selectedFile.file, {
            ...options,
            transform: selectedFile.transform,
          });
        }

        if (abortRef.current || runId !== conversionIdRef.current) {
          dispatch({
            type: 'UPDATE_FILE',
            payload: { id: selectedFile.id, updates: { status: 'pending', progress: 0 } },
          });
          cancelled = true;
          break;
        }

        dispatch({
          type: 'UPDATE_FILE',
          payload: {
            id: selectedFile.id,
            updates: { status: 'completed', progress: 100, result },
          },
        });
        
        // Increment total conversions counter
        dispatch({
          type: 'INCREMENT_CONVERSIONS',
          payload: 1,
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
        
        // Brief pause between conversions
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        if (error instanceof Error && error.message === 'Conversion cancelled') {
          dispatch({
            type: 'UPDATE_FILE',
            payload: { id: selectedFile.id, updates: { status: 'pending', progress: 0 } },
          });
          cancelled = true;
          break;
        }
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

    if (cancelled) {
      return;
    }

    if (successCount > 0) {
      toast.success(`Successfully converted ${successCount} selected file(s)`);
    }
    if (errorCount > 0) {
      toast.error(`Failed to convert ${errorCount} file(s)`);
    }
  }, [files, options, dispatch, convertWithWorker]);

  const cancelConversion = useCallback(() => {
    abortRef.current = true;
    conversionIdRef.current += 1;
    if (pendingRejectRef.current) {
      pendingRejectRef.current(new Error('Conversion cancelled'));
      pendingRejectRef.current = null;
    }
    if (workerRef.current) {
      workerRef.current.terminate();
      workerRef.current = null;
    }
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
        const runId = ++conversionIdRef.current;
        let result: ConvertResult;
        
        // Use Web Worker if available, otherwise fall back to main thread
        if (useWorker.current) {
          result = await convertWithWorker(selectedFile.file, fileId, selectedFile.transform, runId);
        } else {
          dispatch({
            type: 'UPDATE_FILE',
            payload: { id: fileId, updates: { progress: 50 } },
          });
          result = await convertImage(selectedFile.file, {
            ...options,
            transform: selectedFile.transform, // Use file-specific transform
          });
        }

        if (abortRef.current || runId !== conversionIdRef.current) {
          dispatch({
            type: 'UPDATE_FILE',
            payload: { id: fileId, updates: { status: 'pending', progress: 0 } },
          });
          return;
        }

        dispatch({
          type: 'UPDATE_FILE',
          payload: {
            id: fileId,
            updates: { status: 'completed', progress: 100, result },
          },
        });
        
        // Increment total conversions counter
        dispatch({
          type: 'INCREMENT_CONVERSIONS',
          payload: 1,
        });
        
        toast.success(`Converted ${selectedFile.file.name}`);
      } catch (error) {
        if (error instanceof Error && error.message === 'Conversion cancelled') {
          dispatch({
            type: 'UPDATE_FILE',
            payload: { id: fileId, updates: { status: 'pending', progress: 0 } },
          });
          return;
        }
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
    convertSelected,
    convertSingle,
    cancelConversion,
    isConverting,
    options,
    useWorker: useWorker.current,
  };
};
