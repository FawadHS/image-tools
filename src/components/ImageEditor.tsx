import { useState, useEffect, useRef } from 'react';
import { RotateCw, FlipHorizontal, FlipVertical, Wand2, Check, X, Eye, Loader2 } from 'lucide-react';
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
  
  // Get the active file
  const activeFile = state.files.find(f => f.id === state.activeFileId) || state.files[0];
  
  // Get the actual committed state from the active file
  const committedTransform = activeFile?.transform || {
    rotation: 0,
    flipHorizontal: false,
    flipVertical: false,
    filters: {
      brightness: 100,
      contrast: 100,
      saturation: 100,
      grayscale: false,
      sepia: false,
    },
  };

  // Preview state (local, uncommitted changes)
  const [previewTransform, setPreviewTransform] = useState<ImageTransform>(committedTransform);

  // Sync preview with committed state when it changes externally
  // Using JSON.stringify to track deep changes in the transform object
  useEffect(() => {
    setPreviewTransform(committedTransform);
  }, [JSON.stringify(activeFile?.transform), activeFile?.id]);

  const filters = previewTransform.filters || {
    brightness: 100,
    contrast: 100,
    saturation: 100,
    grayscale: false,
    sepia: false,
  };

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

  const rotate = () => {
    const newRotation = ((previewTransform.rotation + 90) % 360) as 0 | 90 | 180 | 270;
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
      filters: {
        brightness: 100,
        contrast: 100,
        saturation: 100,
        grayscale: false,
        sepia: false,
      },
    });
  };

  const applyChanges = () => {
    if (!activeFile) return;
    
    dispatch({
      type: 'UPDATE_FILE',
      payload: {
        id: activeFile.id,
        updates: {
          transform: previewTransform,
        },
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

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Image Editing
        </h2>
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

      {/* Preview Canvas */}
      {state.files.length > 0 && (
        <div className="mb-6 bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
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
          <div className="flex justify-center items-center min-h-[200px]">
            {!activeFile?.displayPreview ? (
              // Loading state - HEIC conversion in progress
              <div className="flex flex-col items-center gap-3 text-gray-500 dark:text-gray-400">
                <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
                <span className="text-sm">Converting image...</span>
              </div>
            ) : (
              <canvas
                ref={canvasRef}
                className="max-w-full h-auto rounded-lg shadow-sm max-h-[300px]"
              />
            )}
          </div>
        </div>
      )}

      {/* Apply/Discard Buttons */}
      {hasUnappliedChanges && (
        <div className="mb-4 flex gap-2">
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
      )}

      {/* Rotate & Flip Section */}
      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Transform
          </h3>
          <div className="grid grid-cols-3 gap-2">
            {/* Rotate Button */}
            <button
              onClick={rotate}
              className="flex flex-col items-center justify-center p-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/30 hover:border-primary-500 transition-all"
              title="Rotate 90° clockwise"
            >
              <RotateCw className="w-5 h-5 text-gray-700 dark:text-gray-300 mb-1" />
              <span className="text-xs text-gray-600 dark:text-gray-400">Rotate</span>
              {previewTransform.rotation !== 0 && (
                <span className="text-xs font-semibold text-primary-600 dark:text-primary-400">
                  {previewTransform.rotation}°
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
        </div>

        {/* Filters Section */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
              <Wand2 className="w-4 h-4" />
              Filters
            </h3>
          </div>

          <div className="space-y-4">
            {/* Brightness */}
            <div>
              <div className="flex justify-between items-center mb-2">
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
              <div className="flex justify-between items-center mb-2">
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
              <div className="flex justify-between items-center mb-2">
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
          </div>
        </div>
      </div>
    </div>
  );
};