import { useState, useRef, useEffect } from 'react';
import { Type, Plus, Trash2, Move } from 'lucide-react';
import toast from 'react-hot-toast';
import { useConverter } from '../context/ConverterContext';
import { applyTransformationsToCanvas, canvasToImage } from '../utils/imageTransform';

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
  const [previewImage, setPreviewImage] = useState<HTMLImageElement | null>(null);
  const [overlays, setOverlays] = useState<TextOverlayConfig[]>([]);
  const [selectedOverlay, setSelectedOverlay] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const transform = state.options.transform;

  // Load preview image from first file with transformations applied
  useEffect(() => {
    if (state.files.length > 0 && state.files[0].preview) {
      const img = new Image();
      img.onload = async () => {
        // Apply all transformations except text overlay (since we're in the text tool)
        try {
          const transformedCanvas = applyTransformationsToCanvas(
            img,
            transform,
            false, // include crop
            true // exclude text overlay
          );
          const transformedImg = await canvasToImage(transformedCanvas);
          setPreviewImage(transformedImg);
        } catch (error) {
          console.error('Failed to apply transformations:', error);
          setPreviewImage(img);
        }
      };
      img.src = state.files[0].preview;
    }
  }, [state.files, transform?.crop, transform?.rotation, transform?.flipHorizontal, transform?.flipVertical, transform?.filters]);

  // Restore existing text overlay from state
  useEffect(() => {
    if (transform?.textOverlay && overlays.length === 0) {
      setOverlays([transform.textOverlay]);
    }
  }, [transform?.textOverlay]);

  // Draw preview on canvas
  useEffect(() => {
    if (!canvasRef.current || !previewImage) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size to fit container
    const maxWidth = 600;
    const maxHeight = 400;
    const scale = Math.min(
      maxWidth / previewImage.width,
      maxHeight / previewImage.height,
      1
    );

    canvas.width = previewImage.width * scale;
    canvas.height = previewImage.height * scale;

    // Draw image
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(previewImage, 0, 0, canvas.width, canvas.height);

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
  }, [previewImage, overlays, selectedOverlay]);

  const addTextOverlay = () => {
    const newOverlay: TextOverlayConfig = {
      text: 'Sample Text',
      x: previewImage ? previewImage.width / 2 - 50 : 100,
      y: previewImage ? previewImage.height / 2 - 20 : 100,
      fontSize: 40,
      fontFamily: 'Arial',
      color: '#ffffff',
      opacity: 1,
    };
    setOverlays([...overlays, newOverlay]);
    setSelectedOverlay(overlays.length);
    toast.success('Text overlay added');
  };

  const removeOverlay = (index: number) => {
    setOverlays(overlays.filter((_, i) => i !== index));
    if (selectedOverlay === index) {
      setSelectedOverlay(null);
    }
    toast.success('Text overlay removed');
  };

  const updateOverlay = (index: number, updates: Partial<TextOverlayConfig>) => {
    setOverlays(
      overlays.map((overlay, i) => (i === index ? { ...overlay, ...updates } : overlay))
    );
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !previewImage) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scale = canvas.width / previewImage.width;
    const x = ((e.clientX - rect.left) / scale);
    const y = ((e.clientY - rect.top) / scale);

    // Check if clicked on existing overlay
    const canvas2d = canvas.getContext('2d');
    if (!canvas2d) return;

    for (let i = overlays.length - 1; i >= 0; i--) {
      const overlay = overlays[i];
      canvas2d.font = `${overlay.fontSize}px ${overlay.fontFamily}`;
      const metrics = canvas2d.measureText(overlay.text);
      const textHeight = overlay.fontSize * 1.2;

      if (
        x >= overlay.x &&
        x <= overlay.x + metrics.width &&
        y >= overlay.y &&
        y <= overlay.y + textHeight
      ) {
        setSelectedOverlay(i);
        setIsDragging(true);
        return;
      }
    }

    setSelectedOverlay(null);
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging || selectedOverlay === null || !canvasRef.current || !previewImage) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scale = canvas.width / previewImage.width;
    const x = ((e.clientX - rect.left) / scale);
    const y = ((e.clientY - rect.top) / scale);

    updateOverlay(selectedOverlay, { x, y });
  };

  const handleCanvasMouseUp = () => {
    setIsDragging(false);
  };

  const applyTextOverlay = () => {
    if (overlays.length === 0) return;

    const currentTransform = transform || {
      rotation: 0 as const,
      flipHorizontal: false,
      flipVertical: false,
    };

    // For now, we'll save the first overlay (can be extended to support multiple)
    dispatch({
      type: 'SET_OPTIONS',
      payload: {
        transform: {
          ...currentTransform,
          textOverlay: overlays[0],
        },
      },
    });

    toast.success(`Text overlay applied: "${overlays[0].text.substring(0, 20)}${overlays[0].text.length > 20 ? '...' : ''}"`, {
      icon: '✏️',
    });
  };

  const resetTextOverlay = () => {
    setOverlays([]);
    setSelectedOverlay(null);

    const currentTransform = transform || {
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

    toast.success('Text overlay removed');
  };

  const hasTextOverlay = overlays.length > 0;

  if (state.files.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2 mb-4">
          <Type className="w-5 h-5 text-gray-700 dark:text-gray-300" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Text Overlay
          </h2>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Upload an image to add text overlays
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Type className="w-5 h-5 text-gray-700 dark:text-gray-300" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Text Overlay
          </h2>
        </div>
        {hasTextOverlay && (
          <button
            onClick={resetTextOverlay}
            className="text-xs font-medium text-primary-600 dark:text-primary-400 hover:underline"
          >
            Reset All
          </button>
        )}
      </div>

      {/* Canvas Preview */}
      <div className="mb-4 flex justify-center bg-gray-100 dark:bg-gray-900 rounded-lg p-4">
        <canvas
          ref={canvasRef}
          onClick={handleCanvasClick}
          onMouseMove={handleCanvasMouseMove}
          onMouseUp={handleCanvasMouseUp}
          onMouseLeave={handleCanvasMouseUp}
          className="cursor-pointer border border-gray-300 dark:border-gray-600"
        />
      </div>

      {/* Add Overlay Button */}
      <button
        onClick={addTextOverlay}
        className="w-full mb-4 flex items-center justify-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium text-sm transition-colors"
      >
        <Plus className="w-4 h-4" />
        Add Text Overlay
      </button>

      {/* Overlay List and Editor */}
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
                {/* Text Input */}
                <div>
                  <label className="text-xs font-medium text-gray-700 dark:text-gray-300 block mb-1">
                    Text
                  </label>
                  <input
                    type="text"
                    value={overlay.text}
                    onChange={(e) => updateOverlay(index, { text: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Enter text"
                  />
                </div>

                {/* Font Family */}
                <div>
                  <label className="text-xs font-medium text-gray-700 dark:text-gray-300 block mb-1">
                    Font
                  </label>
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

                {/* Font Size */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                      Font Size
                    </label>
                    <span className="text-xs font-semibold text-primary-600 dark:text-primary-400">
                      {overlay.fontSize}px
                    </span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="200"
                    value={overlay.fontSize}
                    onChange={(e) => updateOverlay(index, { fontSize: Number(e.target.value) })}
                    aria-label="Font size in pixels"
                    className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary-600"
                  />
                </div>

                {/* Color */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-gray-700 dark:text-gray-300 block mb-1">
                      Color
                    </label>
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
                      <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                        Opacity
                      </label>
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

          {/* Action Buttons */}
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
