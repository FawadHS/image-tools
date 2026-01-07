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

export const SettingsPanel: React.FC = () => {
  const { state, dispatch } = useConverter();
  const { options } = state;

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
  };

  const handleQualityChange = (quality: number) => {
    dispatch({
      type: 'SET_OPTIONS',
      payload: { quality, preset: 'custom' },
    });
  };

  const handleDimensionChange = (dimension: 'maxWidth' | 'maxHeight', value: string) => {
    const numValue = value ? parseInt(value, 10) : undefined;
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
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Output Format
        </label>
        <div className="grid grid-cols-2 gap-2">
          {OUTPUT_FORMATS.map((format) => (
            <button
              key={format.id}
              onClick={() => handleOutputFormatChange(format.id)}
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
        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          {OUTPUT_FORMATS.find(f => f.id === options.outputFormat)?.description}
        </p>
      </div>

      {/* Preset Selector */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Preset
        </label>
        <select
          value={options.preset || 'custom'}
          onChange={(e) => handlePresetChange(e.target.value as PresetType)}
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
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Quality
          </label>
          <span className="text-sm font-semibold text-primary-600 dark:text-primary-400">
            {options.quality}%
          </span>
        </div>
        <input
          type="range"
          min="1"
          max="100"
          value={options.quality}
          onChange={(e) => handleQualityChange(parseInt(e.target.value, 10))}
          disabled={options.lossless}
          className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary-600 disabled:opacity-50"
        />
        <div className="flex justify-between text-xs text-gray-400 mt-1">
          <span>Smaller file</span>
          <span>Higher quality</span>
        </div>
      </div>

      {/* Dimensions */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Max Dimensions (px)
        </label>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <input
              type="number"
              placeholder="Width"
              value={options.maxWidth || ''}
              onChange={(e) => handleDimensionChange('maxWidth', e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <div>
            <input
              type="number"
              placeholder="Height"
              value={options.maxHeight || ''}
              onChange={(e) => handleDimensionChange('maxHeight', e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Leave empty to keep original size
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
