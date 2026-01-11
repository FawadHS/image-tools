import { useState, useRef, useEffect } from 'react';
import { Type, Plus, Trash2, Move, Check, X, Eye } from 'lucide-react';
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

export const TextOverlayTool = () => {
  const { state, dispatch } = useConverter();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // Processed image (EXIF-normalized + rotation/flip/filters/crop applied)
  const [processedImage, setProcessedImage] = useState<HTMLImageElement | null>(null);
  const [overlays, setOverlays] = useState<TextOverlayConfig[]>([]);
  const [selectedOverlay, setSelectedOverlay] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [lastTransformState, setLastTransformState] = useState<string>('');

  // Get the active file
  const activeFile = state.files.find(f => f.id === state.activeFileId) || state.files[0];

  // Track committed overlay from active file
  const committedOverlay = activeFile?.transform?.textOverlay;
  
  // Sync overlays with committed state when it changes externally
  // Text coordinates are stored in transformed+cropped space, no adjustment needed
  useEffect(() => {
    if (committedOverlay) {
      setOverlays([{ ...committedOverlay }]);
    } else {
      setOverlays([]);
    }
  }, [JSON.stringify(committedOverlay), activeFile?.id]);
  
  // Check if preview differs from committed state
  const hasUnappliedChanges = JSON.stringify(overlays[0]) !== JSON.stringify(committedOverlay);

  // Load fully processed image (rotation + flip + filters + crop)
  // This is the SAME image that will be exported
  useEffect(() => {
    if (state.files.length === 0 || !activeFile) return;

    const currentTransformState = JSON.stringify({
      src: activeFile.preview,
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
        // Load original image with EXIF normalization
        const response = await fetch(activeFile.preview);
        const blob = await response.blob();
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

      // Draw selection box
      if (selectedOverlay === index) {
        const metrics = ctx.measureText(overlay.text);
        const textHeight = scaledFontSize * 1.2;
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 2;
        ctx.globalAlpha = 1;
        ctx.strokeRect(scaledX - 5, scaledY - 5, metrics.width + 10, textHeight + 10);
      }
      ctx.restore();
    });
  }, [processedImage, overlays, selectedOverlay]);

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
    
    setOverlays([...overlays, newOverlay]);
    setSelectedOverlay(overlays.length);
    toast.success('Text added', { duration: 2000 });
  };

  const removeOverlay = (index: number) => {
    setOverlays(overlays.filter((_, i) => i !== index));
    if (selectedOverlay === index) {
      setSelectedOverlay(null);
    }
    toast.success('Text removed', { duration: 2000 });
  };

  const updateOverlay = (index: number, updates: Partial<TextOverlayConfig>) => {
    setOverlays(overlays.map((overlay, i) => (i === index ? { ...overlay, ...updates } : overlay)));
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !processedImage) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const imgWidth = processedImage.naturalWidth || processedImage.width;
    const scale = canvas.width / imgWidth;
    
    // Convert click coordinates to natural pixel space
    const x = (e.clientX - rect.left) / scale;
    const y = (e.clientY - rect.top) / scale;

    // Check if clicked on existing overlay
    const canvas2d = canvas.getContext('2d');
    if (!canvas2d) return;

    for (let i = overlays.length - 1; i >= 0; i--) {
      const overlay = overlays[i];
      canvas2d.font = `${overlay.fontSize}px ${overlay.fontFamily}`;
      const metrics = canvas2d.measureText(overlay.text);
      const textHeight = overlay.fontSize * 1.2;

      if (x >= overlay.x && x <= overlay.x + metrics.width && y >= overlay.y && y <= overlay.y + textHeight) {
        setSelectedOverlay(i);
        setIsDragging(true);
        return;
      }
    }

    setSelectedOverlay(null);
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging || selectedOverlay === null || !canvasRef.current || !processedImage) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const imgWidth = processedImage.naturalWidth || processedImage.width;
    const imgHeight = processedImage.naturalHeight || processedImage.height;
    const scale = canvas.width / imgWidth;
    
    // Convert mouse coordinates to natural pixel space
    const x = (e.clientX - rect.left) / scale;
    const y = (e.clientY - rect.top) / scale;

    // Keep within bounds
    const boundedX = Math.max(0, Math.min(x, imgWidth - 50));
    const boundedY = Math.max(0, Math.min(y, imgHeight - 20));

    updateOverlay(selectedOverlay, { x: boundedX, y: boundedY });
  };

  const handleCanvasMouseUp = () => {
    setIsDragging(false);
  };

  // Touch event handlers for mobile support
  const handleCanvasTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length !== 1) return;
    e.preventDefault();
    
    const touch = e.touches[0];
    const canvas = canvasRef.current;
    if (!canvas || !processedImage) return;

    const rect = canvas.getBoundingClientRect();
    const imgWidth = processedImage.naturalWidth || processedImage.width;
    const scale = canvas.width / imgWidth;

    const x = (touch.clientX - rect.left) / scale;
    const y = (touch.clientY - rect.top) / scale;

    // Check if touching an overlay
    for (let i = overlays.length - 1; i >= 0; i--) {
      const overlay = overlays[i];
      const ctx = canvas.getContext('2d');
      if (!ctx) continue;

      ctx.font = `${overlay.fontSize * scale}px ${overlay.fontFamily}`;
      const metrics = ctx.measureText(overlay.text);
      const textHeight = overlay.fontSize * scale * 1.2;

      const scaledX = overlay.x * scale;
      const scaledY = overlay.y * scale;

      if (
        x * scale >= scaledX - 5 &&
        x * scale <= scaledX + metrics.width + 5 &&
        y * scale >= scaledY - 5 &&
        y * scale <= scaledY + textHeight + 5
      ) {
        setSelectedOverlay(i);
        setIsDragging(true);
        return;
      }
    }

    setSelectedOverlay(null);
  };

  const handleCanvasTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDragging || selectedOverlay === null || !canvasRef.current || !processedImage || e.touches.length !== 1) return;
    e.preventDefault();

    const touch = e.touches[0];
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const imgWidth = processedImage.naturalWidth || processedImage.width;
    const imgHeight = processedImage.naturalHeight || processedImage.height;
    const scale = canvas.width / imgWidth;
    
    const x = (touch.clientX - rect.left) / scale;
    const y = (touch.clientY - rect.top) / scale;

    const boundedX = Math.max(0, Math.min(x, imgWidth - 50));
    const boundedY = Math.max(0, Math.min(y, imgHeight - 20));

    updateOverlay(selectedOverlay, { x: boundedX, y: boundedY });
  };

  const handleCanvasTouchEnd = () => {
    setIsDragging(false);
  };
  
  const discardTextOverlay = () => {
    if (committedOverlay) {
      setOverlays([committedOverlay]);
    } else {
      setOverlays([]);
    }
    setSelectedOverlay(null);
  };

  const applyTextOverlay = () => {
    if (overlays.length === 0) {
      toast.error('No text overlay to apply');
      return;
    }

    if (!overlays[0].text || overlays[0].text.trim() === '') {
      toast.error('Text cannot be empty');
      return;
    }

    if (!activeFile) return;

    // Store overlay coordinates as-is (they're already in transformed+cropped space)
    // The text is positioned on the image shown in the preview
    const savedOverlay = { ...overlays[0] };

    const currentTransform = activeFile.transform || {
      rotation: 0 as const,
      flipHorizontal: false,
      flipVertical: false,
    };

    dispatch({
      type: 'UPDATE_FILE',
      payload: {
        id: activeFile.id,
        updates: {
          transform: {
            ...currentTransform,
            textOverlay: savedOverlay,
          },
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
      rotation: 0 as const,
      flipHorizontal: false,
      flipVertical: false,
    };

    dispatch({
      type: 'UPDATE_FILE',
      payload: {
        id: activeFile.id,
        updates: {
          transform: {
            ...currentTransform,
            textOverlay: undefined,
          },
        },
      },
    });

    toast.success('Text removed', { duration: 2000 });
  };

  if (state.files.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2 mb-4">
          <Type className="w-5 h-5 text-gray-700 dark:text-gray-300" />
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
          <Type className="w-5 h-5 text-gray-700 dark:text-gray-300" />
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

      <div className="mb-4 bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2 mb-3">
          <Eye className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Preview</h3>
        </div>
        <div className="flex justify-center items-center max-h-[300px] overflow-hidden">
        <canvas
          ref={canvasRef}
          onClick={handleCanvasClick}
          onMouseMove={handleCanvasMouseMove}
          onMouseUp={handleCanvasMouseUp}
          onMouseLeave={handleCanvasMouseUp}
          onTouchStart={handleCanvasTouchStart}
          onTouchMove={handleCanvasTouchMove}
          onTouchEnd={handleCanvasTouchEnd}
          onTouchCancel={handleCanvasTouchEnd}
          className="cursor-pointer border border-gray-300 dark:border-gray-600 rounded max-w-full max-h-[300px] object-contain touch-none"
        />
        </div>
      </div>

      <button
        onClick={addTextOverlay}
        className="w-full mb-4 flex items-center justify-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium text-sm transition-colors"
      >
        <Plus className="w-4 h-4" />
        Add Text Overlay
      </button>

      {hasUnappliedChanges && overlays.length > 0 && (
        <div className="mb-4 flex gap-2">
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

      {overlays.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
            <Move className="w-4 h-4" />
            <span>Click and drag text on canvas to reposition</span>
          </div>

          {overlays.map((overlay, index) => (
            <div
              key={index}
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
  );
};
