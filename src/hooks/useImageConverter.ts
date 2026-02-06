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
  const pendingRejectsRef = useRef<Set<(error: Error) => void>>(new Set());
  const workerPoolRef = useRef<Worker[]>([]);
  // Web Worker now uses unified pipeline (renderEditsToOffscreenCanvas)
  // matching the exact transformation order of main thread
  const useWorker = useRef(isWorkerSupported());

  const notifyAiFallback = useCallback((result: ConvertResult, filename: string) => {
    if (result.aiSkippedReason) {
      toast(`AI skipped for ${filename}: ${result.aiSkippedReason}`);
      return;
    }
    if (result.aiFallback) {
      const reason = result.aiSkippedReason ? `: ${result.aiSkippedReason}` : '';
      toast(`AI fallback for ${filename}${reason || ': used standard compression'}`);
    }
  }, []);

  const makeAiStatusHandler = useCallback(
    (fileId: string) => {
      return (update: { status: 'queued' | 'processing' | 'polling' | 'done' | 'error'; message?: string; jobId?: string }) => {
        dispatch({
          type: 'UPDATE_FILE',
          payload: {
            id: fileId,
            updates: {
              aiStatus: update.status,
              aiMessage: update.message,
              aiJobId: update.jobId,
            },
          },
        });
      };
    },
    [dispatch]
  );

  const getWorkerConcurrency = useCallback(() => {
    const cores = typeof navigator !== 'undefined' ? navigator.hardwareConcurrency || 4 : 4;
    return Math.min(Math.max(cores - 1, 1), 3);
  }, []);

  const ensureWorkerPool = useCallback(() => {
    if (!useWorker.current) return [];
    if (workerPoolRef.current.length > 0) return workerPoolRef.current;
    const count = getWorkerConcurrency();
    try {
      workerPoolRef.current = Array.from({ length: count }, () =>
        new Worker(new URL('../workers/converter.worker.ts', import.meta.url), { type: 'module' })
      );
      return workerPoolRef.current;
    } catch (error) {
      console.warn('Failed to initialize Web Workers, falling back to main thread:', error);
      useWorker.current = false;
      workerPoolRef.current = [];
      return [];
    }
  }, [getWorkerConcurrency]);

  // Initialize worker
  useEffect(() => {
    ensureWorkerPool();
    return () => {
      workerPoolRef.current.forEach((worker) => worker.terminate());
      workerPoolRef.current = [];
    };
  }, [ensureWorkerPool]);

  /**
   * Convert using Web Worker (if supported)
   * Handles HEIC preprocessing on main thread (required) then sends to worker
   * @param file - The file to convert
   * @param fileId - Unique identifier for progress tracking
   * @returns Promise resolving to conversion result
   */
  const convertWithWorker = useCallback(
    async (
      worker: Worker,
      file: File,
      fileId: string,
      fileTransform: any,
      runId: number,
      renameSequence: number
    ): Promise<ConvertResult> => {
      return new Promise(async (resolve, reject) => {
        pendingRejectsRef.current.add(reject);

        // Preprocess HEIC if needed (HEIC conversion must happen on main thread)
        let blob: Blob = file;
        if (isHeicFile(file)) {
          try {
            blob = await convertHeicToBlob(file);
          } catch (error) {
            pendingRejectsRef.current.delete(reject);
            reject(error);
            return;
          }
        }

        const handleMessage = (e: MessageEvent) => {
          if (runId !== conversionIdRef.current || abortRef.current) {
            worker.removeEventListener('message', handleMessage);
            pendingRejectsRef.current.delete(reject);
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
            pendingRejectsRef.current.delete(reject);
            resolve(payload);
          } else if (type === 'error') {
            worker.removeEventListener('message', handleMessage);
            pendingRejectsRef.current.delete(reject);
            reject(new Error(error || 'Worker conversion failed'));
          }
        };

        worker.addEventListener('message', handleMessage);

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
              renameSequence,
            },
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
    const runId = ++conversionIdRef.current;

    let successCount = 0;
    let errorCount = 0;
    let cancelled = false;
    const sequenceStart = options.renameSequenceStart ?? 1;
    const outputFormat = options.outputFormat || 'webp';
    const shouldUseWasm = Boolean(options.useWasmEncoders) && (outputFormat === 'webp' || outputFormat === 'avif' || outputFormat === 'jxl');
    const workerSupported = outputFormat === 'webp' || outputFormat === 'jpeg' || outputFormat === 'png' || outputFormat === 'avif';
    const canUseWorker = useWorker.current && workerSupported && !options.preserveMetadata && !shouldUseWasm && (!options.aiMode || options.aiMode === 'none');
    const workers = canUseWorker ? ensureWorkerPool() : [];
    const concurrency = Math.min(workers.length || 1, pendingFiles.length);
    let index = 0;

    const processNext = async () => {
      while (index < pendingFiles.length) {
        const currentIndex = index++;
        const selectedFile = pendingFiles[currentIndex];
        const renameSequence = sequenceStart + currentIndex;

        if (abortRef.current || runId !== conversionIdRef.current) {
          cancelled = true;
          return;
        }

        dispatch({
          type: 'UPDATE_FILE',
          payload: { id: selectedFile.id, updates: { status: 'converting', progress: 20, aiStatus: undefined, aiMessage: undefined, aiJobId: undefined } },
        });

        try {
          await new Promise(resolve => setTimeout(resolve, 50));

          let result: ConvertResult;
          if (workers.length > 0) {
            const worker = workers[currentIndex % workers.length];
            result = await convertWithWorker(
              worker,
              selectedFile.file,
              selectedFile.id,
              selectedFile.transform,
              runId,
              renameSequence
            );
          } else {
            dispatch({
              type: 'UPDATE_FILE',
              payload: { id: selectedFile.id, updates: { progress: 50 } },
            });
            result = await convertImage(selectedFile.file, {
              ...options,
              transform: selectedFile.transform,
              renameSequence,
            }, makeAiStatusHandler(selectedFile.id));
          }

          if (abortRef.current || runId !== conversionIdRef.current) {
            dispatch({
              type: 'UPDATE_FILE',
              payload: { id: selectedFile.id, updates: { status: 'pending', progress: 0 } },
            });
            cancelled = true;
            return;
          }

          dispatch({
            type: 'UPDATE_FILE',
            payload: {
              id: selectedFile.id,
              updates: { status: 'completed', progress: 100, result, aiStatus: undefined, aiMessage: undefined },
            },
          });

          notifyAiFallback(result, selectedFile.file.name);

          dispatch({ type: 'INCREMENT_CONVERSIONS', payload: 1 });

          logConversion({
            action: 'convert',
            fileCount: 1,
            inputSize: result.originalSize,
            outputSize: result.convertedSize,
            inputFormat: selectedFile.file.type,
            outputFormat: options.outputFormat || 'webp',
          }).catch(() => {});

          addToHistory({
            filename: result.filename,
            originalSize: result.originalSize,
            convertedSize: result.convertedSize,
            reduction: result.reduction,
            format: options.outputFormat || 'webp',
            quality: options.quality,
          });

          successCount++;
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error) {
          if (error instanceof Error && error.message === 'Conversion cancelled') {
            dispatch({
              type: 'UPDATE_FILE',
              payload: { id: selectedFile.id, updates: { status: 'pending', progress: 0 } },
            });
            cancelled = true;
            return;
          }
          const errorMessage = error instanceof Error ? error.message : 'Conversion failed';
          dispatch({
            type: 'UPDATE_FILE',
            payload: {
              id: selectedFile.id,
              updates: { status: 'error', progress: 0, error: errorMessage, aiStatus: 'error', aiMessage: errorMessage },
            },
          });
          errorCount++;
        }
      }
    };

    await Promise.all(Array.from({ length: concurrency }, () => processNext()));

    dispatch({ type: 'SET_CONVERTING', payload: false });

    if (cancelled) {
      toast('Conversion cancelled');
      return;
    }

    if (successCount > 0) {
      toast.success(`Successfully converted ${successCount} file(s)`);
    }
    if (errorCount > 0) {
      toast.error(`Failed to convert ${errorCount} file(s)`);
    }
  }, [files, options, dispatch, convertWithWorker, ensureWorkerPool]);

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
    const sequenceStart = options.renameSequenceStart ?? 1;
    const outputFormat = options.outputFormat || 'webp';
    const shouldUseWasm = Boolean(options.useWasmEncoders) && (outputFormat === 'webp' || outputFormat === 'avif' || outputFormat === 'jxl');
    const workerSupported = outputFormat === 'webp' || outputFormat === 'jpeg' || outputFormat === 'png' || outputFormat === 'avif';
    const canUseWorker = useWorker.current && workerSupported && !options.preserveMetadata && !shouldUseWasm && (!options.aiMode || options.aiMode === 'none');
    const workers = canUseWorker ? ensureWorkerPool() : [];
    const concurrency = Math.min(workers.length || 1, selectedFiles.length);
    let index = 0;

    const processNext = async () => {
      while (index < selectedFiles.length) {
        const currentIndex = index++;
        const selectedFile = selectedFiles[currentIndex];
        const renameSequence = sequenceStart + currentIndex;

        if (abortRef.current || runId !== conversionIdRef.current) {
          cancelled = true;
          return;
        }

        dispatch({
          type: 'UPDATE_FILE',
          payload: { id: selectedFile.id, updates: { status: 'converting', progress: 20, aiStatus: undefined, aiMessage: undefined, aiJobId: undefined } },
        });

        try {
          await new Promise(resolve => setTimeout(resolve, 50));

          let result: ConvertResult;
          if (workers.length > 0) {
            const worker = workers[currentIndex % workers.length];
            result = await convertWithWorker(
              worker,
              selectedFile.file,
              selectedFile.id,
              selectedFile.transform,
              runId,
              renameSequence
            );
          } else {
            dispatch({
              type: 'UPDATE_FILE',
              payload: { id: selectedFile.id, updates: { progress: 50 } },
            });
            result = await convertImage(selectedFile.file, {
              ...options,
              transform: selectedFile.transform,
              renameSequence,
            }, makeAiStatusHandler(selectedFile.id));
          }

          if (abortRef.current || runId !== conversionIdRef.current) {
            dispatch({
              type: 'UPDATE_FILE',
              payload: { id: selectedFile.id, updates: { status: 'pending', progress: 0 } },
            });
            cancelled = true;
            return;
          }

          dispatch({
            type: 'UPDATE_FILE',
            payload: {
              id: selectedFile.id,
              updates: { status: 'completed', progress: 100, result, aiStatus: undefined, aiMessage: undefined },
            },
          });

          notifyAiFallback(result, selectedFile.file.name);

          dispatch({ type: 'INCREMENT_CONVERSIONS', payload: 1 });

          addToHistory({
            filename: result.filename,
            originalSize: result.originalSize,
            convertedSize: result.convertedSize,
            reduction: result.reduction,
            format: options.outputFormat || 'webp',
            quality: options.quality,
          });

          successCount++;
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error) {
          if (error instanceof Error && error.message === 'Conversion cancelled') {
            dispatch({
              type: 'UPDATE_FILE',
              payload: { id: selectedFile.id, updates: { status: 'pending', progress: 0 } },
            });
            cancelled = true;
            return;
          }
          const errorMessage = error instanceof Error ? error.message : 'Conversion failed';
          dispatch({
            type: 'UPDATE_FILE',
            payload: {
              id: selectedFile.id,
              updates: { status: 'error', progress: 0, error: errorMessage, aiStatus: 'error', aiMessage: errorMessage },
            },
          });
          errorCount++;
        }
      }
    };

    await Promise.all(Array.from({ length: concurrency }, () => processNext()));

    dispatch({ type: 'SET_CONVERTING', payload: false });

    if (cancelled) {
      toast('Conversion cancelled');
      return;
    }

    if (successCount > 0) {
      toast.success(`Successfully converted ${successCount} selected file(s)`);
    }
    if (errorCount > 0) {
      toast.error(`Failed to convert ${errorCount} file(s)`);
    }
  }, [files, options, dispatch, convertWithWorker, ensureWorkerPool]);

  const cancelConversion = useCallback(() => {
    abortRef.current = true;
    conversionIdRef.current += 1;
    pendingRejectsRef.current.forEach((reject) => {
      reject(new Error('Conversion cancelled'));
    });
    pendingRejectsRef.current.clear();
    workerPoolRef.current.forEach((worker) => worker.terminate());
    workerPoolRef.current = [];
  }, []);

  const convertSingle = useCallback(
    async (fileId: string) => {
      const selectedFile = files.find((f) => f.id === fileId);
      if (!selectedFile) return;

      dispatch({
        type: 'UPDATE_FILE',
        payload: { id: fileId, updates: { status: 'converting', progress: 10, aiStatus: undefined, aiMessage: undefined, aiJobId: undefined } },
      });

      try {
        const runId = ++conversionIdRef.current;
        const renameSequence = options.renameSequenceStart ?? 1;
        let result: ConvertResult;
        const outputFormat = options.outputFormat || 'webp';
        const shouldUseWasm = Boolean(options.useWasmEncoders) && (outputFormat === 'webp' || outputFormat === 'avif' || outputFormat === 'jxl');
        const workerSupported = outputFormat === 'webp' || outputFormat === 'jpeg' || outputFormat === 'png' || outputFormat === 'avif';
        const canUseWorker = useWorker.current && workerSupported && !options.preserveMetadata && !shouldUseWasm && (!options.aiMode || options.aiMode === 'none');
        
        // Use Web Worker if available and metadata preservation is off
        if (canUseWorker) {
          const workers = ensureWorkerPool();
          const worker = workers[0];
          if (!worker) {
            throw new Error('Worker not available');
          }
          result = await convertWithWorker(
            worker,
            selectedFile.file,
            fileId,
            selectedFile.transform,
            runId,
            renameSequence
          );
        } else {
          dispatch({
            type: 'UPDATE_FILE',
            payload: { id: fileId, updates: { progress: 50 } },
          });
          result = await convertImage(selectedFile.file, {
            ...options,
            transform: selectedFile.transform, // Use file-specific transform
            renameSequence,
          }, makeAiStatusHandler(fileId));
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
            updates: { status: 'completed', progress: 100, result, aiStatus: undefined, aiMessage: undefined },
          },
        });
        
        notifyAiFallback(result, selectedFile.file.name);
        
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
            updates: { status: 'error', progress: 0, error: errorMessage, aiStatus: 'error', aiMessage: errorMessage },
          },
        });
        toast.error(`Failed to convert ${selectedFile.file.name}`);
      }
    },
    [files, options, dispatch, convertWithWorker, ensureWorkerPool]
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
