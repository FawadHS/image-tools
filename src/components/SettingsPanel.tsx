import React from 'react';
import { useConverter } from '../context/ConverterContext';
import { presetList, getPreset } from '../utils/presets';
import { PresetType, OutputFormat } from '../types';

const OUTPUT_FORMATS: { id: OutputFormat; name: string; description: string }[] = [
  { id: 'webp', name: 'WebP', description: 'Best compression, modern browsers' },
  { id: 'jpeg', name: 'JPEG', description: 'Universal compatibility' },
  { id: 'png', name: 'PNG', description: 'Lossless, transparency support' },
  { id: 'avif', name: 'AVIF', description: 'Next-gen, Chrome/Firefox only' },
];

const RESIZE_PRESETS = [
  { id: 'original', name: 'Original Size', width: undefined, height: undefined },
  { id: '4k', name: '4K (3840px)', width: 3840, height: 2160 },
  { id: 'fhd', name: 'Full HD (1920px)', width: 1920, height: 1080 },
  { id: 'hd', name: 'HD (1280px)', width: 1280, height: 720 },
  { id: 'medium', name: 'Medium (800px)', width: 800, height: 800 },
  { id: 'thumbnail', name: 'Thumbnail (400px)', width: 400, height: 400 },
  { id: 'custom', name: 'Custom', width: undefined, height: undefined },
];

export const SettingsPanel: React.FC = () => {
  const { state, dispatch } = useConverter();
  const { options } = state;
  const [resizePreset, setResizePreset] = React.useState('original');

  const handleOutputFormatChange = (format: OutputFormat) => {
    dispatch({ type: 'SET_OUTPUT_FORMAT', payload: format });
  };

  const handlePresetChange = (presetId: PresetType) => {
    const preset = getPreset(presetId);
    dispatch({
      type: 'SET_OPTIONS',
      payload: {
        preset: presetId,
        quality: preset.quality,
        maxWidth: preset.maxWidth,
        maxHeight: preset.maxHeight,
      },
    });
    // Update resize preset based on dimensions
    if (preset.maxWidth) {
      const matched = RESIZE_PRESETS.find(r => r.width === preset.maxWidth);
      setResizePreset(matched ? matched.id : 'custom');
    }
  };

  const handleQualityChange = (quality: number) => {
    dispatch({
      type: 'SET_OPTIONS',
      payload: { quality, preset: 'custom' },
    });
  };

  const handleResizePresetChange = (presetId: string) => {
    setResizePreset(presetId);
    const preset = RESIZE_PRESETS.find(p => p.id === presetId);
    if (preset && presetId !== 'custom') {
      dispatch({
        type: 'SET_OPTIONS',
        payload: { 
          maxWidth: preset.width, 
          maxHeight: preset.height,
          preset: 'custom' 
        },
      });
    }
  };

  const handleDimensionChange = (dimension: 'maxWidth' | 'maxHeight', value: string) => {
    const numValue = value ? parseInt(value, 10) : undefined;
    setResizePreset('custom');
    dispatch({
      type: 'SET_OPTIONS',
      payload: { [dimension]: numValue, preset: 'custom' },
    });
  };

  const handleCheckboxChange = (field: 'lossless' | 'maintainAspectRatio' | 'stripMetadata') => {
    dispatch({
      type: 'SET_OPTIONS',
      payload: { [field]: !options[field] },
    });
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Conversion Settings
      </h2>

      {/* Output Format Selector */}
      <fieldset className="mb-6">
        <legend className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Output Format
        </legend>
        <div className="grid grid-cols-2 gap-2" role="group" aria-label="Select output format">
          {OUTPUT_FORMATS.map((format) => (
            <button
              key={format.id}
              onClick={() => handleOutputFormatChange(format.id)}
              type="button"
              aria-label={`Select ${format.name} format - ${format.description}`}
              className={`
                px-3 py-2 text-sm font-medium rounded-lg border-2 transition-all
                ${options.outputFormat === format.id
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                  : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 text-gray-700 dark:text-gray-300'
                }
              `}
            >
              {format.name}
            </button>
          ))}
        </div>
        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400" aria-live="polite">
          {OUTPUT_FORMATS.find(f => f.id === options.outputFormat)?.description}
        </p>
      </fieldset>

      {/* Preset Selector */}
      <div className="mb-6">
        <label htmlFor="preset-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Preset
        </label>
        <select
          id="preset-select"
          value={options.preset || 'custom'}
          onChange={(e) => handlePresetChange(e.target.value as PresetType)}
          aria-label="Select quality preset"
          className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        >
          {presetList.map((preset) => (
            <option key={preset.id} value={preset.id}>
              {preset.name}
            </option>
          ))}
        </select>
        {options.preset && options.preset !== 'custom' && (
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {getPreset(options.preset).description}
          </p>
        )}
      </div>

      {/* Quality Slider */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <label htmlFor="quality-slider" className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Quality
          </label>
          <span className="text-sm font-semibold text-primary-600 dark:text-primary-400" aria-live="polite">
            {options.quality}%
          </span>
        </div>
        <input
          id="quality-slider"
          type="range"
          min="1"
          max="100"
          value={options.quality}
          onChange={(e) => handleQualityChange(parseInt(e.target.value, 10))}
          disabled={options.lossless}
          aria-label={`Quality: ${options.quality}%`}
          aria-valuenow={options.quality}
          aria-valuemin={1}
          aria-valuemax={100}
          className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary-600 disabled:opacity-50"
        />
        <div className="flex justify-between text-xs text-gray-400 mt-1">
          <span>Smaller file</span>
          <span>Higher quality</span>
        </div>
      </div>

      {/* Dimensions */}
      <div className="mb-6">
        <label htmlFor="resize-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Resize
        </label>
        <select
          id="resize-select"
          value={resizePreset}
          onChange={(e) => handleResizePresetChange(e.target.value)}
          aria-label="Select resize preset"
          className="w-full px-3 py-2 mb-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        >
          {RESIZE_PRESETS.map((preset) => (
            <option key={preset.id} value={preset.id}>
              {preset.name}
            </option>
          ))}
        </select>
        
        {resizePreset === 'custom' && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="custom-width" className="sr-only">Custom width in pixels</label>
              <input
                id="custom-width"
                type="number"
                placeholder="Width"
                aria-label="Custom width in pixels"
                value={options.maxWidth || ''}
                onChange={(e) => handleDimensionChange('maxWidth', e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <div>
              <label htmlFor="custom-height" className="sr-only">Custom height in pixels</label>
              <input
                id="custom-height"
                type="number"
                placeholder="Height"
                aria-label="Custom height in pixels"
                value={options.maxHeight || ''}
                onChange={(e) => handleDimensionChange('maxHeight', e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>
        )}
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          {resizePreset === 'original' ? 'Images will keep their original dimensions' : 
           resizePreset === 'custom' ? 'Enter custom max dimensions' : 
           'Images larger than this will be scaled down'}
        </p>
      </div>

      {/* Checkboxes */}
      <div className="space-y-3">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={options.lossless}
            onChange={() => handleCheckboxChange('lossless')}
            className="w-4 h-4 text-primary-600 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded focus:ring-primary-500"
          />
          <span className="text-sm text-gray-700 dark:text-gray-300">
            Lossless compression
          </span>
        </label>

        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={options.maintainAspectRatio}
            onChange={() => handleCheckboxChange('maintainAspectRatio')}
            className="w-4 h-4 text-primary-600 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded focus:ring-primary-500"
          />
          <span className="text-sm text-gray-700 dark:text-gray-300">
            Maintain aspect ratio
          </span>
        </label>

        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={options.stripMetadata}
            onChange={() => handleCheckboxChange('stripMetadata')}
            className="w-4 h-4 text-primary-600 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded focus:ring-primary-500"
          />
          <span className="text-sm text-gray-700 dark:text-gray-300">
            Strip metadata (smaller files)
          </span>
        </label>
      </div>
    </div>
  );
};
