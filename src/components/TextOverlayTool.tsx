import { useState, useRef, useEffect } from 'react';
import { Type, Plus, Trash2, Move } from 'lucide-react';
import toast from 'react-hot-toast';
import { useConverter } from '../context/ConverterContext';

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
  const [currentImage, setCurrentImage] = useState<HTMLImageElement | null>(null);
  const [overlays, setOverlays] = useState<TextOverlayConfig[]>([]);
  const [selectedOverlay, setSelectedOverlay] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Load image with crop applied (the "current" state for text overlay)
  // Text overlay works on whatever image state exists (after crop)
  useEffect(() => {
    if (state.files.length === 0 || !state.files[0].preview) return;

    const img = new Image();
    img.onload = () => {
      // If there's a crop, create a cropped version
      if (state.options.transform?.crop) {
        const crop = state.options.transform.crop;
        const canvas = document.createElement('canvas');
        canvas.width = crop.width;
        canvas.height = crop.height;
        const ctx = canvas.getContext('2d');
        
        if (ctx) {
          ctx.drawImage(
            img,
            crop.x,
            crop.y,
            crop.width,
            crop.height,
            0,
            0,
            crop.width,
            crop.height
          );
          
          const croppedImg = new Image();
          croppedImg.onload = () => {
            setCurrentImage(croppedImg);
          };
          croppedImg.src = canvas.toDataURL();
        } else {
          setCurrentImage(img);
        }
      } else {
        // No crop, use original image
        setCurrentImage(img);
      }
    };
    img.src = state.files[0].preview;
  }, [state.files, state.options.transform?.crop]);

  // Restore existing text overlay from state
  useEffect(() => {
    if (state.options.transform?.textOverlay) {
      const savedOverlay = state.options.transform.textOverlay;
      
      // Text overlay coordinates are stored relative to ORIGINAL image
      // We need to adjust them to be relative to the CURRENT (possibly cropped) image
      let adjustedOverlay = { ...savedOverlay };
      
      if (state.options.transform?.crop) {
        const crop = state.options.transform.crop;
        adjustedOverlay = {
          ...savedOverlay,
          x: savedOverlay.x - crop.x,
          y: savedOverlay.y - crop.y,
        };
      }
      
      setOverlays([adjustedOverlay]);
    } else {
      setOverlays([]);
    }
  }, [state.options.transform?.textOverlay, state.options.transform?.crop]);

  // Draw canvas preview
  useEffect(() => {
    if (!canvasRef.current || !currentImage) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Scale to fit container - use smaller max dimensions to ensure it fits
    const maxWidth = 450;
    const maxHeight = 300;
    const scale = Math.min(maxWidth / currentImage.width, maxHeight / currentImage.height, 1);

    canvas.width = Math.floor(currentImage.width * scale);
    canvas.height = Math.floor(currentImage.height * scale);

    // Draw image
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(currentImage, 0, 0, canvas.width, canvas.height);

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
  }, [currentImage, overlays, selectedOverlay]);

  const addTextOverlay = () => {
    if (!currentImage) {
      toast.error('Image not loaded');
      return;
    }

    // Add text in center of CURRENT image (which may be cropped)
    const newOverlay: TextOverlayConfig = {
      text: 'Sample Text',
      x: Math.max(0, currentImage.width / 2 - 50),
      y: Math.max(0, currentImage.height / 2 - 20),
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
    if (!canvasRef.current || !currentImage) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scale = canvas.width / currentImage.width;
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
    if (!isDragging || selectedOverlay === null || !canvasRef.current || !currentImage) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scale = canvas.width / currentImage.width;
    const x = (e.clientX - rect.left) / scale;
    const y = (e.clientY - rect.top) / scale;

    // Keep within bounds
    const boundedX = Math.max(0, Math.min(x, currentImage.width - 50));
    const boundedY = Math.max(0, Math.min(y, currentImage.height - 20));

    updateOverlay(selectedOverlay, { x: boundedX, y: boundedY });
  };

  const handleCanvasMouseUp = () => {
    setIsDragging(false);
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

    // Convert overlay coordinates back to original image space
    let savedOverlay = { ...overlays[0] };
    
    if (state.options.transform?.crop) {
      const crop = state.options.transform.crop;
      savedOverlay = {
        ...overlays[0],
        x: overlays[0].x + crop.x,
        y: overlays[0].y + crop.y,
      };
    }

    const currentTransform = state.options.transform || {
      rotation: 0 as const,
      flipHorizontal: false,
      flipVertical: false,
    };

    dispatch({
      type: 'SET_OPTIONS',
      payload: {
        transform: {
          ...currentTransform,
          textOverlay: savedOverlay,
        },
      },
    });

    toast.success('Text applied', { duration: 2000 });
  };

  const resetTextOverlay = () => {
    setOverlays([]);
    setSelectedOverlay(null);

    const currentTransform = state.options.transform || {
      rotation: 0 as const,
      flipHorizontal: false,
      flipVertical: false,
    };

    dispatch({
      type: 'SET_OPTIONS',
      payload: {
        transform: {
          ...currentTransform,
          textOverlay: undefined,
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
        </div>
        {overlays.length > 0 && (
          <button
            onClick={resetTextOverlay}
            className="text-xs font-medium text-primary-600 dark:text-primary-400 hover:underline"
          >
            Reset All
          </button>
        )}
      </div>

      <div className="mb-4 flex justify-center items-center bg-gray-100 dark:bg-gray-900 rounded-lg p-4 max-h-[350px] overflow-hidden">
        <canvas
          ref={canvasRef}
          onClick={handleCanvasClick}
          onMouseMove={handleCanvasMouseMove}
          onMouseUp={handleCanvasMouseUp}
          onMouseLeave={handleCanvasMouseUp}
          className="cursor-pointer border border-gray-300 dark:border-gray-600 rounded max-w-full max-h-[300px] object-contain"
        />
      </div>

      <button
        onClick={addTextOverlay}
        className="w-full mb-4 flex items-center justify-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium text-sm transition-colors"
      >
        <Plus className="w-4 h-4" />
        Add Text Overlay
      </button>

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

          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              onClick={resetTextOverlay}
              className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 font-medium text-sm transition-colors"
            >
              Reset
            </button>
            <button
              onClick={applyTextOverlay}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium text-sm transition-colors"
            >
              Apply Overlay
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
