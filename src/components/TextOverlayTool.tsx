import { useState, useRef, useEffect } from 'react';
import { Type, Plus, Trash2, Move, Check, X, Eye, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useConverter } from '../context/ConverterContext';
import { loadImageWithExif, renderEditsToCanvas } from '../utils/imageTransform';

interface TextOverlayConfig {
  text: string;
  x: number;
  y: number;
  fontSize: number;
  fontFamily: string;
  color: string;
  opacity: number;
}

const normalizeOverlays = (transform: { textOverlay?: TextOverlayConfig; textOverlays?: TextOverlayConfig[] } | undefined): TextOverlayConfig[] => {
  if (!transform) return [];
  if (transform.textOverlays && transform.textOverlays.length > 0) {
    return transform.textOverlays.map((overlay) => ({ ...overlay }));
  }
  if (transform.textOverlay) {
    return [{ ...transform.textOverlay }];
  }
  return [];
};

export const TextOverlayTool = () => {
  const { state, dispatch } = useConverter();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // Processed image (EXIF-normalized + rotation/flip/filters/crop applied)
  const [processedImage, setProcessedImage] = useState<HTMLImageElement | null>(null);
  const [overlays, setOverlays] = useState<TextOverlayConfig[]>([]);
  const [selectedOverlay, setSelectedOverlay] = useState<number | null>(null);
  const [hoveredOverlay, setHoveredOverlay] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number } | null>(null);
  const activePointerIdRef = useRef<number | null>(null);
  const [lastTransformState, setLastTransformState] = useState<string>('');
  const [isCoarsePointer, setIsCoarsePointer] = useState(false);
  const [nudgeStep, setNudgeStep] = useState(5);

  // Get the active file
  const activeFile = state.files.find(f => f.id === state.activeFileId) || state.files[0];

  // Track committed overlays from active file
  const committedOverlays = normalizeOverlays(activeFile?.transform);
  
  // Sync overlays with committed state when it changes externally
  // Text coordinates are stored in transformed+cropped space, no adjustment needed
  useEffect(() => {
    setOverlays(committedOverlays);
    setHoveredOverlay(null);
    setSelectedOverlay(null);
  }, [JSON.stringify(committedOverlays), activeFile?.id]);
  
  // Check if preview differs from committed state
  const hasUnappliedChanges = JSON.stringify(overlays) !== JSON.stringify(committedOverlays);

  // Load fully processed image (rotation + flip + filters + crop)
  // This is the SAME image that will be exported
  // Uses displayPreview which is pre-converted for HEIC files
  useEffect(() => {
    if (state.files.length === 0 || !activeFile || !activeFile.displayPreview) return;

    const currentTransformState = JSON.stringify({
      src: activeFile.displayPreview,
      rotation: activeFile.transform?.rotation,
      flipHorizontal: activeFile.transform?.flipHorizontal,
      flipVertical: activeFile.transform?.flipVertical,
      filters: activeFile.transform?.filters,
      crop: activeFile.transform?.crop,
    });
    
    if (lastTransformState === currentTransformState) return;

    // Load image and apply ALL transforms using unified pipeline
    const loadProcessedImage = async () => {
      try {
        // Fetch from displayPreview (already converted if HEIC)
        const response = await fetch(activeFile.displayPreview!);
        const blob = await response.blob();
        
        // Load image with EXIF normalization
        const img = await loadImageWithExif(blob);

        // Use unified render pipeline (WITHOUT text overlay)
        // This produces the EXACT same canvas that will be exported
        const canvas = renderEditsToCanvas(img, activeFile.transform, false);
        
        // Convert to image for display
        const processedImg = new Image();
        processedImg.onload = () => {
          setProcessedImage(processedImg);
          setLastTransformState(currentTransformState);
        };
        processedImg.src = canvas.toDataURL();
      } catch (error) {
        console.error('Failed to load processed image:', error);
        toast.error('Failed to load image');
      }
    };

    loadProcessedImage();
  }, [activeFile, lastTransformState, state.files.length]);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const media = window.matchMedia('(pointer: coarse)');
    const update = () => setIsCoarsePointer(media.matches);
    update();
    if (media.addEventListener) {
      media.addEventListener('change', update);
      return () => media.removeEventListener('change', update);
    }
    media.addListener(update);
    return () => media.removeListener(update);
  }, []);

  const getOverlayBounds = (
    overlay: TextOverlayConfig,
    ctx: CanvasRenderingContext2D,
    padding: number = 6
  ) => {
    const effectivePadding = isCoarsePointer ? Math.max(padding, 18) : padding;
    ctx.font = `${overlay.fontSize}px ${overlay.fontFamily}`;
    const metrics = ctx.measureText(overlay.text);
    const textHeight = overlay.fontSize * 1.2;
    return {
      x: overlay.x - effectivePadding,
      y: overlay.y - effectivePadding,
      width: metrics.width + effectivePadding * 2,
      height: textHeight + effectivePadding * 2,
    };
  };

  const getOverlayAtPoint = (
    x: number,
    y: number,
    ctx: CanvasRenderingContext2D
  ): number | null => {
    for (let i = overlays.length - 1; i >= 0; i--) {
      const overlay = overlays[i];
      const bounds = getOverlayBounds(overlay, ctx);
      if (
        x >= bounds.x &&
        x <= bounds.x + bounds.width &&
        y >= bounds.y &&
        y <= bounds.y + bounds.height
      ) {
        return i;
      }
    }
    return null;
  };

  const getCanvasPoint = (event: { clientX: number; clientY: number }) => {
    if (!canvasRef.current || !processedImage) return null;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const imgWidth = processedImage.naturalWidth || processedImage.width;
    const scale = canvas.width / imgWidth;
    const x = (event.clientX - rect.left) / scale;
    const y = (event.clientY - rect.top) / scale;
    return { x, y };
  };

  // Draw canvas preview
  useEffect(() => {
    if (!canvasRef.current || !processedImage) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Scale to fit container
    const maxWidth = 450;
    const maxHeight = 300;
    const imgWidth = processedImage.naturalWidth || processedImage.width;
    const imgHeight = processedImage.naturalHeight || processedImage.height;
    const scale = Math.min(maxWidth / imgWidth, maxHeight / imgHeight, 1);

    canvas.width = Math.floor(imgWidth * scale);
    canvas.height = Math.floor(imgHeight * scale);

    // Draw processed image (already has all transforms)
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(processedImage, 0, 0, canvas.width, canvas.height);

    // Draw text overlays
    overlays.forEach((overlay, index) => {
      const scaledX = overlay.x * scale;
      const scaledY = overlay.y * scale;
      const scaledFontSize = overlay.fontSize * scale;

      ctx.save();
      ctx.font = `${scaledFontSize}px ${overlay.fontFamily}`;
      ctx.fillStyle = overlay.color;
      ctx.globalAlpha = overlay.opacity;
      ctx.textBaseline = 'top';
      ctx.fillText(overlay.text, scaledX, scaledY);

      // Draw hover/selection box
      if (selectedOverlay === index || hoveredOverlay === index) {
        const metrics = ctx.measureText(overlay.text);
        const textHeight = scaledFontSize * 1.2;
        ctx.strokeStyle = selectedOverlay === index ? '#3b82f6' : '#93c5fd';
        ctx.lineWidth = selectedOverlay === index ? 2 : 1;
        ctx.globalAlpha = 1;
        ctx.strokeRect(scaledX - 5, scaledY - 5, metrics.width + 10, textHeight + 10);
      }
      ctx.restore();
    });
  }, [processedImage, overlays, selectedOverlay, hoveredOverlay]);

  const addTextOverlay = () => {
    if (!processedImage) {
      toast.error('Image not loaded');
      return;
    }

    const imgWidth = processedImage.naturalWidth || processedImage.width;
    const imgHeight = processedImage.naturalHeight || processedImage.height;

    // Add text in center of processed image
    const newOverlay: TextOverlayConfig = {
      text: 'Sample Text',
      x: Math.max(0, imgWidth / 2 - 50),
      y: Math.max(0, imgHeight / 2 - 20),
      fontSize: 40,
      fontFamily: 'Arial',
      color: '#ffffff',
      opacity: 1,
    };
    
    setOverlays((prev) => {
      const next = [...prev, newOverlay];
      setSelectedOverlay(next.length - 1);
      return next;
    });
    toast.success('Text added', { duration: 2000 });
  };

  const removeOverlay = (index: number) => {
    setOverlays(overlays.filter((_, i) => i !== index));
    setSelectedOverlay((current) => {
      if (current === null) return null;
      if (current === index) return null;
      if (current > index) return current - 1;
      return current;
    });
    toast.success('Text removed', { duration: 2000 });
  };

  const updateOverlay = (index: number, updates: Partial<TextOverlayConfig>) => {
    setOverlays(overlays.map((overlay, i) => (i === index ? { ...overlay, ...updates } : overlay)));
  };

  const nudgeOverlay = (index: number, dx: number, dy: number) => {
    const overlay = overlays[index];
    if (!overlay || !processedImage) return;
    const imgWidth = processedImage.naturalWidth || processedImage.width;
    const imgHeight = processedImage.naturalHeight || processedImage.height;
    const nextX = Math.max(0, Math.min(overlay.x + dx, imgWidth));
    const nextY = Math.max(0, Math.min(overlay.y + dy, imgHeight));
    updateOverlay(index, { x: nextX, y: nextY });
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !processedImage) return;
    const point = getCanvasPoint(e);
    if (!point) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const hitIndex = getOverlayAtPoint(point.x, point.y, ctx);
    if (hitIndex !== null) {
      const overlay = overlays[hitIndex];
      setSelectedOverlay(hitIndex);
      setIsDragging(true);
      setDragOffset({ x: point.x - overlay.x, y: point.y - overlay.y });
      activePointerIdRef.current = e.pointerId;
      canvas.setPointerCapture(e.pointerId);
      return;
    }

    setSelectedOverlay(null);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !processedImage) return;
    if (activePointerIdRef.current !== null && e.pointerId !== activePointerIdRef.current) return;

    const point = getCanvasPoint(e);
    if (!point) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const hitIndex = getOverlayAtPoint(point.x, point.y, ctx);
    setHoveredOverlay(hitIndex);
    canvas.style.cursor = hitIndex !== null ? 'move' : 'default';

    if (!isDragging || selectedOverlay === null || !dragOffset) return;
    const overlay = overlays[selectedOverlay];
    if (!overlay) return;

    ctx.font = `${overlay.fontSize}px ${overlay.fontFamily}`;
    const textWidth = ctx.measureText(overlay.text).width;
    const textHeight = overlay.fontSize * 1.2;

    const nextX = point.x - dragOffset.x;
    const nextY = point.y - dragOffset.y;

    // Keep within bounds
    const imgWidth = processedImage.naturalWidth || processedImage.width;
    const imgHeight = processedImage.naturalHeight || processedImage.height;
    const boundedX = Math.max(0, Math.min(nextX, imgWidth - textWidth));
    const boundedY = Math.max(0, Math.min(nextY, imgHeight - textHeight));

    updateOverlay(selectedOverlay, { x: boundedX, y: boundedY });
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (activePointerIdRef.current === e.pointerId) {
      activePointerIdRef.current = null;
    }
    setIsDragging(false);
    setDragOffset(null);
  };

  const handlePointerLeave = () => {
    setIsDragging(false);
    setDragOffset(null);
    setHoveredOverlay(null);
    if (canvasRef.current) {
      canvasRef.current.style.cursor = 'default';
    }
  };
  
  const discardTextOverlay = () => {
    setOverlays(committedOverlays);
    setSelectedOverlay(null);
  };

  const applyTextOverlay = () => {
    if (overlays.length === 0) {
      toast.error('No text overlay to apply');
      return;
    }

    const hasEmptyText = overlays.some((overlay) => !overlay.text || overlay.text.trim() === '');
    if (hasEmptyText) {
      toast.error('Text cannot be empty');
      return;
    }

    if (!activeFile) return;

    const currentTransform = activeFile.transform || {
      rotation: 0,
      flipHorizontal: false,
      flipVertical: false,
    };

    dispatch({
      type: 'UPDATE_FILE_TRANSFORM',
      payload: {
        id: activeFile.id,
        transform: {
          ...currentTransform,
          textOverlay: undefined,
          textOverlays: overlays.map((overlay) => ({ ...overlay })),
        },
      },
    });

    toast.success('Text overlay applied', { duration: 2000 });
  };

  const resetTextOverlay = () => {
    if (!activeFile) return;
    
    setOverlays([]);
    setSelectedOverlay(null);

    const currentTransform = activeFile.transform || {
      rotation: 0,
      flipHorizontal: false,
      flipVertical: false,
    };

    dispatch({
      type: 'UPDATE_FILE_TRANSFORM',
      payload: {
        id: activeFile.id,
        transform: {
          ...currentTransform,
          textOverlay: undefined,
          textOverlays: undefined,
        },
      },
    });

    toast.success('Text removed', { duration: 2000 });
  };

  if (state.files.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2 mb-4">
          <Type className="w-5 h-5 text-primary-400" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Text Overlay</h2>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Upload an image to add text overlays
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Type className="w-5 h-5 text-primary-400" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Text Overlay</h2>
          {hasUnappliedChanges && overlays.length > 0 && (
            <span className="text-xs px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded">
              Unsaved
            </span>
          )}
        </div>
        {overlays.length > 0 && (
          <button
            onClick={resetTextOverlay}
            className="text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
          >
            Reset All
          </button>
        )}
      </div>

      <div className="lg:grid lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] gap-6">
        <div className="space-y-4 lg:sticky lg:top-24 self-start">
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-3">
              <Eye className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Preview</h3>
            </div>
            <div className="flex justify-center items-center max-h-[300px] min-h-[200px] overflow-hidden">
              {!activeFile?.displayPreview ? (
                // Loading state - HEIC conversion in progress
                <div className="flex flex-col items-center gap-3 text-gray-500 dark:text-gray-400">
                  <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
                  <span className="text-sm">Converting image...</span>
                </div>
              ) : !processedImage ? (
                // Loading state - applying transforms
                <div className="flex flex-col items-center gap-3 text-gray-500 dark:text-gray-400">
                  <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
                  <span className="text-sm">Processing...</span>
                </div>
              ) : (
                <canvas
                  ref={canvasRef}
                  onPointerDown={handlePointerDown}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                  onPointerLeave={handlePointerLeave}
                  onPointerCancel={handlePointerUp}
                  className="cursor-pointer border border-gray-300 dark:border-gray-600 rounded max-w-full max-h-[320px] sm:max-h-[420px] object-contain touch-none"
                />
              )}
            </div>
          </div>

          <button
            onClick={addTextOverlay}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium text-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Text Overlay
          </button>

          {hasUnappliedChanges && overlays.length > 0 && (
            <div className="flex gap-2">
              <button
                onClick={applyTextOverlay}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors"
              >
                <Check className="w-4 h-4" />
                Apply Overlay
              </button>
              <button
                onClick={discardTextOverlay}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors"
              >
                <X className="w-4 h-4" />
                Discard
              </button>
            </div>
          )}
        </div>

        <div className="space-y-4">
          {overlays.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                <Move className="w-4 h-4" />
                <span>Tap to select, then drag on canvas to move</span>
              </div>

              {overlays.map((overlay, index) => (
                <div
                  key={index}
                  onClick={() => setSelectedOverlay(index)}
                  className={`p-4 border rounded-lg transition-all ${
                    selectedOverlay === index
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      Overlay {index + 1}
                    </span>
                    <button
                      onClick={() => removeOverlay(index)}
                      className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                      title="Remove overlay"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-3">
                    {selectedOverlay === index && (
                      <div className="rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50/70 dark:bg-gray-800/50 p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Nudge</span>
                          <select
                            value={nudgeStep}
                            onChange={(e) => setNudgeStep(Number(e.target.value))}
                            className="text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded px-2 py-1"
                          >
                            <option value={1}>1px</option>
                            <option value={5}>5px</option>
                            <option value={10}>10px</option>
                          </select>
                        </div>
                        <div className="grid grid-cols-3 gap-2 max-w-[160px]">
                          <div />
                          <button
                            onClick={() => nudgeOverlay(index, 0, -nudgeStep)}
                            className="px-2 py-1 text-xs rounded border border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
                          >
                            Up
                          </button>
                          <div />
                          <button
                            onClick={() => nudgeOverlay(index, -nudgeStep, 0)}
                            className="px-2 py-1 text-xs rounded border border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
                          >
                            Left
                          </button>
                          <button
                            onClick={() => nudgeOverlay(index, 0, nudgeStep)}
                            className="px-2 py-1 text-xs rounded border border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
                          >
                            Down
                          </button>
                          <button
                            onClick={() => nudgeOverlay(index, nudgeStep, 0)}
                            className="px-2 py-1 text-xs rounded border border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
                          >
                            Right
                          </button>
                        </div>
                      </div>
                    )}
                    <div>
                      <label className="text-xs font-medium text-gray-700 dark:text-gray-300 block mb-1">Text</label>
                      <input
                        type="text"
                        value={overlay.text}
                        onChange={(e) => updateOverlay(index, { text: e.target.value })}
                        className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="Enter text"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-medium text-gray-700 dark:text-gray-300 block mb-1">Font</label>
                      <select
                        value={overlay.fontFamily}
                        onChange={(e) => updateOverlay(index, { fontFamily: e.target.value })}
                        aria-label="Font family"
                        className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      >
                        <option value="Arial">Arial</option>
                        <option value="Helvetica">Helvetica</option>
                        <option value="Times New Roman">Times New Roman</option>
                        <option value="Georgia">Georgia</option>
                        <option value="Courier New">Courier New</option>
                        <option value="Verdana">Verdana</option>
                        <option value="Impact">Impact</option>
                        <option value="Comic Sans MS">Comic Sans MS</option>
                      </select>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Font Size</label>
                        <span className="text-xs font-semibold text-primary-600 dark:text-primary-400">{overlay.fontSize}px</span>
                      </div>
                      <input
                        type="range"
                        min="10"
                        max="200"
                        value={overlay.fontSize}
                        onChange={(e) => updateOverlay(index, { fontSize: Number(e.target.value) })}
                        aria-label="Font size"
                        className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary-600"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-medium text-gray-700 dark:text-gray-300 block mb-1">Color</label>
                        <input
                          type="color"
                          value={overlay.color}
                          onChange={(e) => updateOverlay(index, { color: e.target.value })}
                          aria-label="Text color"
                          className="w-full h-10 rounded-lg cursor-pointer"
                        />
                      </div>
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Opacity</label>
                          <span className="text-xs font-semibold text-primary-600 dark:text-primary-400">
                            {Math.round(overlay.opacity * 100)}%
                          </span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.01"
                          value={overlay.opacity}
                          onChange={(e) => updateOverlay(index, { opacity: Number(e.target.value) })}
                          aria-label="Text opacity"
                          className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary-600"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
