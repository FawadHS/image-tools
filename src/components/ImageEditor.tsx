import { RotateCw, FlipHorizontal, FlipVertical } from 'lucide-react';
import { useConverter } from '../context/ConverterContext';
import { ImageTransform } from '../types';

export const ImageEditor = () => {
  const { state, dispatch } = useConverter();
  const transform = state.options.transform || {
    rotation: 0,
    flipHorizontal: false,
    flipVertical: false,
  };

  const updateTransform = (updates: Partial<ImageTransform>) => {
    dispatch({
      type: 'SET_OPTIONS',
      payload: {
        transform: { ...transform, ...updates } as ImageTransform,
      },
    });
  };

  const rotate = () => {
    const newRotation = ((transform.rotation + 90) % 360) as 0 | 90 | 180 | 270;
    updateTransform({ rotation: newRotation });
  };

  const toggleFlipHorizontal = () => {
    updateTransform({ flipHorizontal: !transform.flipHorizontal });
  };

  const toggleFlipVertical = () => {
    updateTransform({ flipVertical: !transform.flipVertical });
  };

  const resetTransforms = () => {
    updateTransform({
      rotation: 0,
      flipHorizontal: false,
      flipVertical: false,
    });
  };

  const hasTransforms =
    transform.rotation !== 0 || transform.flipHorizontal || transform.flipVertical;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Image Editing
        </h2>
        {hasTransforms && (
          <button
            onClick={resetTransforms}
            className="text-xs font-medium text-primary-600 dark:text-primary-400 hover:underline"
          >
            Reset
          </button>
        )}
      </div>

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
              {transform.rotation !== 0 && (
                <span className="text-xs font-semibold text-primary-600 dark:text-primary-400">
                  {transform.rotation}°
                </span>
              )}
            </button>

            {/* Flip Horizontal Button */}
            <button
              onClick={toggleFlipHorizontal}
              className={`flex flex-col items-center justify-center p-3 border rounded-lg transition-all ${
                transform.flipHorizontal
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
                transform.flipVertical
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
      </div>
    </div>
  );
};
