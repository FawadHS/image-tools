import { useState, useEffect, useRef } from 'react';
import { RotateCw, FlipHorizontal, FlipVertical, Wand2, Check, X, Eye, Loader2, Undo2, Redo2, Save, Info } from 'lucide-react';
import { useConverter } from '../context/ConverterContext';
import { ImageTransform } from '../types';
import { CANVAS_PREVIEW_MAX_WIDTH } from '../constants';
import { renderEditsToCanvas } from '../utils/imageTransform';

/**
 * ImageEditor Component
 * Provides rotation, flip, and filter controls with live preview
 * Changes are applied locally until user confirms
 */
export const ImageEditor = () => {
  const { state, dispatch } = useConverter();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [showTips, setShowTips] = useState(false);

  const PRESET_STORAGE_KEY = 'image-tools-edit-presets';
  type EditPreset = { id: string; name: string; transform: ImageTransform };
  
  // Get the active file
  const activeFile = state.files.find(f => f.id === state.activeFileId) || state.files[0];
  
  const defaultFilters = {
    brightness: 100,
    contrast: 100,
    saturation: 100,
    clarity: 0,
    vibrance: 0,
    highlights: 0,
    shadows: 0,
    temperature: 0,
    sharpen: 0,
    blur: 0,
    grayscale: false,
    sepia: false,
  };
  const normalizeFilters = (filters?: ImageTransform['filters']) => ({
    ...defaultFilters,
    ...(filters || {}),
  });

  // Get the actual committed state from the active file
  const committedTransform: ImageTransform = activeFile?.transform
    ? {
        rotation: activeFile.transform.rotation ?? 0,
        flipHorizontal: activeFile.transform.flipHorizontal ?? false,
        flipVertical: activeFile.transform.flipVertical ?? false,
        crop: activeFile.transform.crop,
        textOverlay: activeFile.transform.textOverlay,
        textOverlays: activeFile.transform.textOverlays,
        filters: {
          ...defaultFilters,
          ...activeFile.transform.filters,
        },
      }
    : {
        rotation: 0,
        flipHorizontal: false,
        flipVertical: false,
        filters: defaultFilters,
      };

  // Preview state (local, uncommitted changes)
  const [previewTransform, setPreviewTransform] = useState<ImageTransform>(committedTransform);
  const [editPresets, setEditPresets] = useState<EditPreset[]>([]);
  const [selectedPresetId, setSelectedPresetId] = useState<string>('');
  const [presetName, setPresetName] = useState('');

  useEffect(() => {
    try {
      const stored = localStorage.getItem(PRESET_STORAGE_KEY);
      if (stored) {
        setEditPresets(JSON.parse(stored));
      }
    } catch {
      setEditPresets([]);
    }
  }, []);

  // Sync preview with committed state when it changes externally
  // Using JSON.stringify to track deep changes in the transform object
  useEffect(() => {
    setPreviewTransform(committedTransform);
  }, [JSON.stringify(activeFile?.transform), activeFile?.id]);

  const filters = normalizeFilters(previewTransform.filters);

  // Check if preview differs from committed state
  const hasUnappliedChanges = JSON.stringify(previewTransform) !== JSON.stringify(committedTransform);

  const updatePreviewTransform = (updates: Partial<ImageTransform>) => {
    setPreviewTransform(prev => ({ ...prev, ...updates }));
  };

  const updatePreviewFilters = (filterUpdates: Partial<typeof filters>) => {
    updatePreviewTransform({
      filters: { ...filters, ...filterUpdates },
    });
  };

  const history = activeFile ? state.editHistoryByFileId[activeFile.id] : undefined;
  const canUndo = !!history && history.past.length > 0;
  const canRedo = !!history && history.future.length > 0;

  const handleUndo = () => {
    if (!activeFile || !canUndo) return;
    dispatch({ type: 'UNDO_TRANSFORM', payload: { id: activeFile.id } });
  };

  const handleRedo = () => {
    if (!activeFile || !canRedo) return;
    dispatch({ type: 'REDO_TRANSFORM', payload: { id: activeFile.id } });
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const isMac = navigator.platform.toLowerCase().includes('mac');
      const modKey = isMac ? event.metaKey : event.ctrlKey;
      if (!modKey) return;
      if (event.key.toLowerCase() === 'z' && !event.shiftKey) {
        event.preventDefault();
        handleUndo();
      } else if (
        (event.key.toLowerCase() === 'z' && event.shiftKey) ||
        event.key.toLowerCase() === 'y'
      ) {
        event.preventDefault();
        handleRedo();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [activeFile?.id, canUndo, canRedo]);

  const buildPresetTransform = (transform: ImageTransform): ImageTransform => ({
    rotation: transform.rotation,
    flipHorizontal: transform.flipHorizontal,
    flipVertical: transform.flipVertical,
    filters: normalizeFilters(transform.filters),
  });

  const savePreset = () => {
    const trimmedName = presetName.trim();
    if (!trimmedName) return;
    const newPreset: EditPreset = {
      id: `${Date.now()}`,
      name: trimmedName,
      transform: buildPresetTransform(previewTransform),
    };
    const nextPresets = [...editPresets, newPreset];
    setEditPresets(nextPresets);
    setPresetName('');
    setSelectedPresetId(newPreset.id);
    try {
      localStorage.setItem(PRESET_STORAGE_KEY, JSON.stringify(nextPresets));
    } catch {
      // ignore storage errors
    }
  };

  const deletePreset = () => {
    if (!selectedPresetId) return;
    const nextPresets = editPresets.filter((preset) => preset.id !== selectedPresetId);
    setEditPresets(nextPresets);
    setSelectedPresetId('');
    try {
      localStorage.setItem(PRESET_STORAGE_KEY, JSON.stringify(nextPresets));
    } catch {
      // ignore storage errors
    }
  };

  const applyPresetToFiles = (target: 'active' | 'all') => {
    const preset = editPresets.find((p) => p.id === selectedPresetId);
    if (!preset) return;
    const filesToApply = target === 'all' ? state.files : activeFile ? [activeFile] : [];
    filesToApply.forEach((file) => {
      const currentTransform = file.transform || {
        rotation: 0,
        flipHorizontal: false,
        flipVertical: false,
        filters: { ...defaultFilters },
      };
      const mergedFilters = normalizeFilters(currentTransform.filters);
      const presetFilters = normalizeFilters(preset.transform.filters);

      dispatch({
        type: 'UPDATE_FILE_TRANSFORM',
        payload: {
          id: file.id,
          transform: {
            ...currentTransform,
            rotation: preset.transform.rotation,
            flipHorizontal: preset.transform.flipHorizontal,
            flipVertical: preset.transform.flipVertical,
            filters: {
              ...mergedFilters,
              ...presetFilters,
            },
          },
        },
      });
    });
  };

  const rotate = () => {
    const newRotation = ((previewTransform.rotation + 90) % 360 + 360) % 360;
    updatePreviewTransform({ rotation: newRotation });
  };

  const toggleFlipHorizontal = () => {
    updatePreviewTransform({ flipHorizontal: !previewTransform.flipHorizontal });
  };

  const toggleFlipVertical = () => {
    updatePreviewTransform({ flipVertical: !previewTransform.flipVertical });
  };

  const resetPreview = () => {
    setPreviewTransform({
      rotation: 0,
      flipHorizontal: false,
      flipVertical: false,
      filters: { ...defaultFilters },
    });
  };

  const applyChanges = () => {
    if (!activeFile) return;
    
    dispatch({
      type: 'UPDATE_FILE_TRANSFORM',
      payload: {
        id: activeFile.id,
        transform: previewTransform,
      },
    });
  };

  const discardChanges = () => {
    setPreviewTransform(committedTransform);
  };

  const hasTransforms =
    previewTransform.rotation !== 0 || previewTransform.flipHorizontal || previewTransform.flipVertical;

  const hasFilters =
    filters.brightness !== 100 ||
    filters.contrast !== 100 ||
    filters.saturation !== 100 ||
    (filters.clarity ?? 0) !== 0 ||
    (filters.vibrance ?? 0) !== 0 ||
    (filters.highlights ?? 0) !== 0 ||
    (filters.shadows ?? 0) !== 0 ||
    (filters.temperature ?? 0) !== 0 ||
    (filters.sharpen ?? 0) !== 0 ||
    (filters.blur ?? 0) !== 0 ||
    filters.grayscale ||
    filters.sepia;

  const hasAnyEdits = hasTransforms || hasFilters;

  // Draw preview on canvas using unified render pipeline
  // Uses displayPreview which is pre-converted for HEIC files
  useEffect(() => {
    if (!canvasRef.current || state.files.length === 0 || !activeFile || !activeFile.displayPreview) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.src = activeFile.displayPreview;

    img.onload = () => {
      try {
        // Use the unified render pipeline to properly apply ALL transformations
        // including crop, which is stored in activeFile.transform
        const fullTransform: ImageTransform = {
          ...previewTransform,
          // CRITICAL: Include the crop from the committed state
          // Crop should not be modified in the editor, only rotation/flip/filters
          crop: activeFile.transform?.crop,
          textOverlay: activeFile.transform?.textOverlay,
          textOverlays: activeFile.transform?.textOverlays,
        };
        
        // Render using the unified pipeline (without text overlay for editing preview)
        const renderedCanvas = renderEditsToCanvas(img, fullTransform, false);
        
        // Scale for display if needed
        const scale = Math.min(1, CANVAS_PREVIEW_MAX_WIDTH / renderedCanvas.width);
        canvas.width = renderedCanvas.width * scale;
        canvas.height = renderedCanvas.height * scale;
        
        // Clear and draw the rendered result
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(renderedCanvas, 0, 0, canvas.width, canvas.height);
      } catch (error) {
        console.error('Failed to render preview:', error);
        // Fallback to simple rendering
        const scale = Math.min(1, CANVAS_PREVIEW_MAX_WIDTH / img.width);
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      }
    };
  }, [previewTransform, activeFile, filters]);

  return state.files.length === 0 ? (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="flex items-center gap-2 mb-4">
        <Wand2 className="w-5 h-5 text-primary-400" />
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Image Editing</h2>
      </div>
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Upload an image to start editing
      </p>
    </div>
  ) : (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <Wand2 className="h-4 w-4 text-primary-400" />
          Image Editing
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowTips(true)}
            className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            title="Editing tips"
            aria-label="Editing tips"
          >
            <Info className="w-4 h-4 text-gray-600 dark:text-gray-300" />
          </button>
          <button
            onClick={handleUndo}
            disabled={!canUndo}
            className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Undo"
            aria-label="Undo"
          >
            <Undo2 className="w-4 h-4 text-gray-600 dark:text-gray-300" />
          </button>
          <button
            onClick={handleRedo}
            disabled={!canRedo}
            className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Redo"
            aria-label="Redo"
          >
            <Redo2 className="w-4 h-4 text-gray-600 dark:text-gray-300" />
          </button>
          {hasAnyEdits && (
            <button
              onClick={resetPreview}
              className="text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
              title="Reset all edits"
            >
              Reset All
            </button>
          )}
        </div>
      </div>

      {showTips && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={() => setShowTips(false)}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-xl w-full max-h-[85vh] overflow-y-auto"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-5 py-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Editing Tips</h3>
              <button
                onClick={() => setShowTips(false)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                aria-label="Close tips"
              >
                <X className="w-4 h-4 text-gray-600 dark:text-gray-300" />
              </button>
            </div>
            <div className="px-5 py-4 space-y-4 text-sm text-gray-700 dark:text-gray-300">
              <p>Fine Rotate: use the slider for small angle corrections. Combine with crop to re-frame.</p>
              <p>Clarity boosts local contrast. Keep it low on portraits to avoid harsh edges.</p>
              <p>Vibrance boosts muted colors more than saturated ones. Safer than saturation.</p>
              <p>Highlights/Shadows: recover bright areas or lift dark regions with small moves first.</p>
              <p>Temperature: warm for indoor light, cool for daylight.</p>
              <p>Sharpen adds detail but can amplify noise. Use lightly on large images.</p>
              <p>Blur softens edges for backgrounds. Small values go a long way.</p>
              <p>Undo/Redo: use Ctrl+Z / Ctrl+Shift+Z (or Cmd on Mac).</p>
              <p>Edit Presets: save your favorite edit stack and apply it to multiple files.</p>
            </div>
          </div>
        </div>
      )}

      <div className="lg:grid lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] gap-6">
        <div className="space-y-4 lg:sticky lg:top-24 self-start">
          {/* Preview Canvas */}
          {state.files.length > 0 && (
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2 mb-3">
                <Eye className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Preview
                </h3>
                {hasUnappliedChanges && (
                  <span className="text-xs px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded">
                    Unsaved
                  </span>
                )}
              </div>
              <div className="flex justify-center items-center min-h-[220px]">
                {!activeFile?.displayPreview ? (
                  // Loading state - HEIC conversion in progress
                  <div className="flex flex-col items-center gap-3 text-gray-500 dark:text-gray-400">
                    <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
                    <span className="text-sm">Converting image...</span>
                  </div>
                ) : (
                  <canvas
                    ref={canvasRef}
                    className="max-w-full h-auto rounded-lg shadow-sm max-h-[280px] sm:max-h-[420px]"
                  />
                )}
              </div>
            </div>
          )}
        </div>

        {/* Rotate & Flip Section */}
        <div className="space-y-4 sm:space-y-5">
        <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50/60 dark:bg-gray-900/40 p-4">
          <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3">
            Transform
          </h3>
          <div className="grid grid-cols-3 gap-2">
            {/* Rotate Button */}
            <button
              onClick={rotate}
              className="flex flex-col items-center justify-center p-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/30 hover:border-primary-500 transition-all"
              title="Rotate 90 deg clockwise"
            >
              <RotateCw className="w-5 h-5 text-gray-700 dark:text-gray-300 mb-1" />
              <span className="text-xs text-gray-600 dark:text-gray-400">Rotate</span>
              {previewTransform.rotation !== 0 && (
                <span className="text-xs font-semibold text-primary-600 dark:text-primary-400">
                  {previewTransform.rotation} deg
                </span>
              )}
            </button>

            {/* Flip Horizontal Button */}
            <button
              onClick={toggleFlipHorizontal}
              className={`flex flex-col items-center justify-center p-3 border rounded-lg transition-all ${
                previewTransform.flipHorizontal
                  ? 'bg-primary-50 dark:bg-primary-900/30 border-primary-500 text-primary-700 dark:text-primary-300'
                  : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:bg-primary-50 dark:hover:bg-primary-900/30 hover:border-primary-500'
              }`}
              title="Flip horizontally"
            >
              <FlipHorizontal className="w-5 h-5 text-gray-700 dark:text-gray-300 mb-1" />
              <span className="text-xs text-gray-600 dark:text-gray-400">Flip H</span>
            </button>

            {/* Flip Vertical Button */}
            <button
              onClick={toggleFlipVertical}
              className={`flex flex-col items-center justify-center p-3 border rounded-lg transition-all ${
                previewTransform.flipVertical
                  ? 'bg-primary-50 dark:bg-primary-900/30 border-primary-500 text-primary-700 dark:text-primary-300'
                  : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:bg-primary-50 dark:hover:bg-primary-900/30 hover:border-primary-500'
              }`}
              title="Flip vertically"
            >
              <FlipVertical className="w-5 h-5 text-gray-700 dark:text-gray-300 mb-1" />
              <span className="text-xs text-gray-600 dark:text-gray-400">Flip V</span>
            </button>
          </div>
          <div className="mt-3">
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                Fine Rotate
              </label>
              <span className="text-xs font-semibold text-primary-600 dark:text-primary-400">
                {previewTransform.rotation.toFixed(1)} deg
              </span>
            </div>
            <input
              type="range"
              min="-180"
              max="180"
              step="0.5"
              value={previewTransform.rotation}
              onChange={(e) => updatePreviewTransform({ rotation: Number(e.target.value) })}
              aria-label="Fine rotation slider"
              className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary-600"
            />
          </div>
        </div>

        {/* Filters Section */}
        <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50/60 dark:bg-gray-900/40 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
              <Wand2 className="w-4 h-4" />
              Filters
            </h3>
          </div>

          <div className="space-y-3 sm:space-y-4">
            {/* Brightness */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                  Brightness
                </label>
                <span className="text-xs font-semibold text-primary-600 dark:text-primary-400">
                  {filters.brightness}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="200"
                value={filters.brightness}
                onChange={(e) => updatePreviewFilters({ brightness: Number(e.target.value) })}
                aria-label="Brightness slider"
                className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary-600"
              />
            </div>

            {/* Contrast */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                  Contrast
                </label>
                <span className="text-xs font-semibold text-primary-600 dark:text-primary-400">
                  {filters.contrast}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="200"
                value={filters.contrast}
                onChange={(e) => updatePreviewFilters({ contrast: Number(e.target.value) })}
                aria-label="Contrast slider"
                className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary-600"
              />
            </div>

            {/* Saturation */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                  Saturation
                </label>
                <span className="text-xs font-semibold text-primary-600 dark:text-primary-400">
                  {filters.saturation}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="200"
                value={filters.saturation}
                onChange={(e) => updatePreviewFilters({ saturation: Number(e.target.value) })}
                aria-label="Saturation slider"
                className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary-600"
              />
            </div>

            {/* Style Filters */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => updatePreviewFilters({ grayscale: !filters.grayscale, sepia: false })}
                className={`px-3 py-2 text-xs font-medium border rounded-lg transition-all ${
                  filters.grayscale
                    ? 'bg-primary-50 dark:bg-primary-900/30 border-primary-500 text-primary-700 dark:text-primary-300'
                    : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:bg-primary-50 dark:hover:bg-primary-900/30 text-gray-700 dark:text-gray-300'
                }`}
              >
                Grayscale
              </button>
              <button
                onClick={() => updatePreviewFilters({ sepia: !filters.sepia, grayscale: false })}
                className={`px-3 py-2 text-xs font-medium border rounded-lg transition-all ${
                  filters.sepia
                    ? 'bg-primary-50 dark:bg-primary-900/30 border-primary-500 text-primary-700 dark:text-primary-300'
                    : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:bg-primary-50 dark:hover:bg-primary-900/30 text-gray-700 dark:text-gray-300'
                }`}
              >
                Sepia
              </button>
            </div>

            <details className="pt-2 border-t border-gray-200 dark:border-gray-700">
              <summary className="cursor-pointer select-none text-xs font-semibold text-gray-600 dark:text-gray-400 mb-3">
                Advanced
              </summary>
              <div className="space-y-3 sm:space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                      Clarity
                    </label>
                    <span className="text-xs font-semibold text-primary-600 dark:text-primary-400">
                      {filters.clarity ?? 0}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="-100"
                    max="100"
                    value={filters.clarity ?? 0}
                    onChange={(e) => updatePreviewFilters({ clarity: Number(e.target.value) })}
                    aria-label="Clarity slider"
                    className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary-600"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                      Vibrance
                    </label>
                    <span className="text-xs font-semibold text-primary-600 dark:text-primary-400">
                      {filters.vibrance ?? 0}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="-100"
                    max="100"
                    value={filters.vibrance ?? 0}
                    onChange={(e) => updatePreviewFilters({ vibrance: Number(e.target.value) })}
                    aria-label="Vibrance slider"
                    className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary-600"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                      Highlights
                    </label>
                    <span className="text-xs font-semibold text-primary-600 dark:text-primary-400">
                      {filters.highlights ?? 0}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="-100"
                    max="100"
                    value={filters.highlights ?? 0}
                    onChange={(e) => updatePreviewFilters({ highlights: Number(e.target.value) })}
                    aria-label="Highlights slider"
                    className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary-600"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                      Shadows
                    </label>
                    <span className="text-xs font-semibold text-primary-600 dark:text-primary-400">
                      {filters.shadows ?? 0}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="-100"
                    max="100"
                    value={filters.shadows ?? 0}
                    onChange={(e) => updatePreviewFilters({ shadows: Number(e.target.value) })}
                    aria-label="Shadows slider"
                    className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary-600"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                      Temperature
                    </label>
                    <span className="text-xs font-semibold text-primary-600 dark:text-primary-400">
                      {filters.temperature ?? 0}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="-100"
                    max="100"
                    value={filters.temperature ?? 0}
                    onChange={(e) => updatePreviewFilters({ temperature: Number(e.target.value) })}
                    aria-label="Temperature slider"
                    className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary-600"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                        Sharpen
                      </label>
                      <span className="text-xs font-semibold text-primary-600 dark:text-primary-400">
                        {filters.sharpen ?? 0}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={filters.sharpen ?? 0}
                      onChange={(e) => updatePreviewFilters({ sharpen: Number(e.target.value) })}
                      aria-label="Sharpen slider"
                      className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary-600"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                        Blur
                      </label>
                      <span className="text-xs font-semibold text-primary-600 dark:text-primary-400">
                        {filters.blur ?? 0}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="10"
                      value={filters.blur ?? 0}
                      onChange={(e) => updatePreviewFilters({ blur: Number(e.target.value) })}
                      aria-label="Blur slider"
                      className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary-600"
                    />
                  </div>
                </div>
              </div>
            </details>
          </div>
        </div>

        {/* Edit Presets */}
        <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50/60 dark:bg-gray-900/40 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">
              Edit Presets
            </h3>
            <span className="text-[10px] uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Optional
            </span>
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={presetName}
                onChange={(e) => setPresetName(e.target.value)}
                placeholder="Preset name"
                className="flex-1 px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              <button
                onClick={savePreset}
                className="inline-flex items-center gap-2 px-3 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                <Save className="w-4 h-4" />
                Save
              </button>
            </div>

            <select
              value={selectedPresetId}
              onChange={(e) => setSelectedPresetId(e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">Select a preset</option>
              {editPresets.map((preset) => (
                <option key={preset.id} value={preset.id}>
                  {preset.name}
                </option>
              ))}
            </select>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => applyPresetToFiles('active')}
                disabled={!selectedPresetId}
                className="px-3 py-2 text-xs font-medium rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 hover:bg-primary-50 dark:hover:bg-primary-900/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Apply to Active
              </button>
              <button
                onClick={() => applyPresetToFiles('all')}
                disabled={!selectedPresetId}
                className="px-3 py-2 text-xs font-medium rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 hover:bg-primary-50 dark:hover:bg-primary-900/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Apply to All
              </button>
            </div>

            <button
              onClick={deletePreset}
              disabled={!selectedPresetId}
              className="px-3 py-2 text-xs font-medium rounded-lg border border-red-200 dark:border-red-700 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Delete Preset
            </button>
          </div>
        </div>
        {hasUnappliedChanges && (
          <div className="sticky bottom-0 sm:bottom-2 bg-white/95 dark:bg-gray-800/95 backdrop-blur border border-gray-200 dark:border-gray-700 rounded-lg p-2">
            <div className="flex gap-2">
              <button
                onClick={applyChanges}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors"
              >
                <Check className="w-4 h-4" />
                Apply Changes
              </button>
              <button
                onClick={discardChanges}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors"
              >
                <X className="w-4 h-4" />
                Discard
              </button>
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
  );
};
