import React, { useEffect, useMemo, useState } from 'react';
import { ChevronDown, Sliders, Type, Sparkles } from 'lucide-react';
import { useConverter } from '../context/ConverterContext';
import { presetList, getPreset } from '../utils/presets';
import { PresetType, OutputFormat } from '../types';
import { isFormatSupported } from '../utils/converter';
import { getExtension } from '../utils/imageHelpers';
import { buildOutputFilename } from '../utils/filename';

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

const RENAME_TEMPLATES = [
  {
    id: 'custom',
    name: 'Custom',
    pattern: '{prefix}{name}{suffix}{timestamp}{dimensions}{seq}',
  },
  {
    id: 'ecom-product',
    name: 'E-commerce: Product + Sequence',
    pattern: 'product-{name}{seq}',
  },
  {
    id: 'ecom-size',
    name: 'E-commerce: Name + Size',
    pattern: '{name}-{width}x{height}{seq}',
  },
  {
    id: 'ecom-date',
    name: 'E-commerce: Date + Sequence',
    pattern: '{name}{timestamp}{seq}',
  },
];

export const SettingsPanel: React.FC = () => {
  const { state, dispatch } = useConverter();
  const { options, files, activeFileId } = state;
  const [resizePreset, setResizePreset] = useState('original');
  const [renameTemplate, setRenameTemplate] = useState('custom');
  const [formatSupport, setFormatSupport] = useState<Record<OutputFormat, boolean>>({
    webp: true,
    jpeg: true,
    png: true,
    avif: true,
  });

  useEffect(() => {
    const checkSupport = async () => {
      const [webpSupported, avifSupported] = await Promise.all([
        isFormatSupported('webp'),
        isFormatSupported('avif'),
      ]);
      setFormatSupport((prev) => ({
        ...prev,
        webp: webpSupported,
        avif: avifSupported,
      }));
    };
    checkSupport().catch(() => {
      setFormatSupport((prev) => ({
        ...prev,
        webp: false,
        avif: false,
      }));
    });
  }, []);

  const isWasmFormatEnabled = (format: OutputFormat) =>
    format === 'webp' || format === 'avif';

  const isFormatAvailable = (format: OutputFormat) =>
    formatSupport[format] || isWasmFormatEnabled(format);

  const firstSupportedFormat = useMemo(() => {
    const ordered: OutputFormat[] = ['webp', 'jpeg', 'png', 'avif'];
    return ordered.find((format) => isFormatAvailable(format)) || 'jpeg';
  }, [formatSupport]);

  useEffect(() => {
    if (!isFormatAvailable(options.outputFormat)) {
      dispatch({ type: 'SET_OUTPUT_FORMAT', payload: firstSupportedFormat });
    }
  }, [formatSupport, options.outputFormat, dispatch, firstSupportedFormat]);

  useEffect(() => {
    if (options.aiMode === 'upscale') {
      dispatch({ type: 'SET_OPTIONS', payload: { aiMode: 'none' } });
    }
  }, [options.aiMode, dispatch]);

  useEffect(() => {
    const output = options.outputFormat || 'webp';
    const shouldUseWasm = (output === 'webp' || output === 'avif') && !formatSupport[output];
    if ((options.useWasmEncoders || false) !== shouldUseWasm) {
      dispatch({ type: 'SET_OPTIONS', payload: { useWasmEncoders: shouldUseWasm } });
    }
  }, [options.outputFormat, options.useWasmEncoders, formatSupport, dispatch]);

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

  const handleCheckboxChange = (field: 'lossless' | 'maintainAspectRatio' | 'stripMetadata' | 'preserveMetadata') => {
    dispatch({
      type: 'SET_OPTIONS',
      payload: { [field]: !options[field] },
    });
  };

  const handleAiOptionChange = (
    field: 'aiMode' | 'aiScale' | 'aiQuality' | 'aiOnlyIfSmaller' | 'aiMaxPixels',
    value: string | number | boolean
  ) => {
    dispatch({
      type: 'SET_OPTIONS',
      payload: { [field]: value },
    });
  };

  const handleRenameFieldChange = (field: keyof typeof options, value: string | number | boolean) => {
    dispatch({
      type: 'SET_OPTIONS',
      payload: { [field]: value },
    });
  };

  const handleTemplateChange = (templateId: string) => {
    setRenameTemplate(templateId);
    const template = RENAME_TEMPLATES.find((t) => t.id === templateId);
    if (template) {
      dispatch({
        type: 'SET_OPTIONS',
        payload: { renamePattern: template.pattern },
      });
    }
  };

  const activeFile = files.find((f) => f.id === activeFileId) || files[0];
  const previewWidth =
    activeFile?.result?.dimensions.width ||
    activeFile?.transform?.crop?.width ||
    options.maxWidth ||
    1000;
  const previewHeight =
    activeFile?.result?.dimensions.height ||
    activeFile?.transform?.crop?.height ||
    options.maxHeight ||
    1000;
  const aiMaxPixels = options.aiMaxPixels || 12_000_000;
  const previewPixels = previewWidth * previewHeight;
  const aiPixelLimitReached = previewPixels > aiMaxPixels;
  const aiMaxMegapixels = (aiMaxPixels / 1_000_000).toFixed(1);
  const previewExtension = getExtension(options.outputFormat || 'webp');
  const previewFilename = activeFile
    ? buildOutputFilename(
        activeFile.file.name,
        previewExtension,
        previewWidth,
        previewHeight,
        options
      )
    : 'example-output' + previewExtension;


  const Section: React.FC<{
    title: string;
    children: React.ReactNode;
    defaultOpen?: boolean;
    icon?: React.ReactNode;
  }> = ({ title, children, defaultOpen, icon }) => (
    <details
      className="group rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
      open={defaultOpen}
    >
      <summary className="cursor-pointer select-none px-4 py-3 text-sm font-semibold text-gray-900 dark:text-white flex items-center justify-between gap-3 flex-wrap">
        <span className="flex items-center gap-2 min-w-0 flex-1 break-words">
          {icon}
          {title}
        </span>
        <ChevronDown className="h-4 w-4 text-gray-400 transition-transform group-open:rotate-180" />
      </summary>
      <div className="px-4 pb-4 pt-1">{children}</div>
    </details>
  );

  return (
    <div className="space-y-4">
      <Section title="Conversion" defaultOpen icon={<Sliders className="h-4 w-4 text-primary-400" />}>
        {/* Output Format Selector */}
        <fieldset className="mb-6">
          <legend className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Output Format
          </legend>
          <div className="grid grid-cols-2 gap-2" role="group" aria-label="Select output format">
            {OUTPUT_FORMATS.map((format) => {
              const isSupported = isFormatAvailable(format.id);
              const isWasmOnly = !formatSupport[format.id] && isWasmFormatEnabled(format.id);
              return (
              <button
                key={format.id}
                onClick={() => handleOutputFormatChange(format.id)}
                type="button"
                aria-label={`Select ${format.name} format - ${format.description}`}
                disabled={!isSupported}
                className={`
                  px-3 py-2 text-sm font-medium rounded-lg border-2 transition-all
                  ${options.outputFormat === format.id && isSupported
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                    : isSupported
                    ? 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 text-gray-700 dark:text-gray-300'
                    : 'border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                  }
                `}
              >
                {format.name}
                {isWasmOnly && (
                  <span className="ml-2 text-[10px] uppercase tracking-wide text-primary-500">
                    WASM
                  </span>
                )}
              </button>
            );
            })}
          </div>
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400 break-words" aria-live="polite">
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
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 break-words">
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
              checked={options.preserveMetadata || false}
              onChange={() => handleCheckboxChange('preserveMetadata')}
              disabled={options.outputFormat !== 'jpeg'}
              className="w-4 h-4 text-primary-600 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded focus:ring-primary-500"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Preserve metadata (JPEG only)
            </span>
          </label>
          <p className="text-xs text-gray-500 dark:text-gray-400 break-words">
            Privacy-first by default. Metadata preservation works only when input and output are JPEG.
          </p>
        </div>
      </Section>

      <Section title="File Naming (Batch Rename)" icon={<Type className="h-4 w-4 text-primary-400" />}>
        <div className="mb-4">
          <label htmlFor="rename-template" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Template
          </label>
          <select
            id="rename-template"
            value={renameTemplate}
            onChange={(e) => handleTemplateChange(e.target.value)}
            className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            {RENAME_TEMPLATES.map((template) => (
              <option key={template.id} value={template.id}>
                {template.name}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-4">
          <label htmlFor="rename-pattern" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Pattern
          </label>
          <input
            id="rename-pattern"
            type="text"
            value={options.renamePattern || ''}
            onChange={(e) => handleRenameFieldChange('renamePattern', e.target.value)}
            className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400 break-words">
            Tokens: {'{name} {prefix} {suffix} {timestamp} {dimensions} {width} {height} {seq} {ext} {extDot}'}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <label htmlFor="rename-prefix" className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">
              Prefix
            </label>
            <input
              id="rename-prefix"
              type="text"
              value={options.namePrefix || ''}
              onChange={(e) => handleRenameFieldChange('namePrefix', e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="e.g. shop_"
            />
          </div>
          <div>
            <label htmlFor="rename-suffix" className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">
              Suffix
            </label>
            <input
              id="rename-suffix"
              type="text"
              value={options.nameSuffix || ''}
              onChange={(e) => handleRenameFieldChange('nameSuffix', e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="e.g. _hero"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <label htmlFor="rename-seq-start" className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">
              Sequence start
            </label>
            <input
              id="rename-seq-start"
              type="number"
              min={1}
              value={options.renameSequenceStart ?? 1}
              onChange={(e) => handleRenameFieldChange('renameSequenceStart', parseInt(e.target.value, 10) || 1)}
              className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <div>
            <label htmlFor="rename-seq-pad" className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">
              Sequence pad
            </label>
            <input
              id="rename-seq-pad"
              type="number"
              min={0}
              value={options.renameSequencePad ?? 0}
              onChange={(e) => handleRenameFieldChange('renameSequencePad', parseInt(e.target.value, 10) || 0)}
              className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="space-y-2 mb-4">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={options.addSequence || false}
              onChange={() => handleRenameFieldChange('addSequence', !options.addSequence)}
              className="w-4 h-4 text-primary-600 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded focus:ring-primary-500"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">Include sequence</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={options.addTimestamp || false}
              onChange={() => handleRenameFieldChange('addTimestamp', !options.addTimestamp)}
              className="w-4 h-4 text-primary-600 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded focus:ring-primary-500"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">Include timestamp</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={options.addDimensions || false}
              onChange={() => handleRenameFieldChange('addDimensions', !options.addDimensions)}
              className="w-4 h-4 text-primary-600 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded focus:ring-primary-500"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">Include dimensions</span>
          </label>
        </div>

        <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-3 py-2">
          <p className="text-xs text-gray-500 dark:text-gray-400">Preview</p>
          <p className="text-sm font-medium text-gray-900 dark:text-white break-all">
            {previewFilename}
          </p>
        </div>
      </Section>

      <Section title="AI Enhancements" defaultOpen icon={<Sparkles className="h-4 w-4 text-primary-400" />}>
        <div className="mb-3">
          <label htmlFor="ai-mode" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Mode
          </label>
          <select
            id="ai-mode"
            value={options.aiMode || 'none'}
            onChange={(e) => handleAiOptionChange('aiMode', e.target.value)}
            className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="none">Off</option>
            <option value="compress">Smart Compression</option>
          </select>
          <p className="mt-2 text-xs text-amber-500 dark:text-amber-400">
            Upscale is temporarily disabled while we finalize the AI provider.
          </p>
        </div>

        {options.aiMode === 'compress' && (
          <div className="mb-3">
            <label htmlFor="ai-quality" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Compression quality
            </label>
            <input
              id="ai-quality"
              type="number"
              min={10}
              max={100}
              value={options.aiQuality || 80}
              onChange={(e) => handleAiOptionChange('aiQuality', parseInt(e.target.value, 10) || 80)}
              className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        )}

        {options.aiMode !== 'none' && (
          <label className="flex items-center gap-3 cursor-pointer mb-3">
            <input
              type="checkbox"
              checked={options.aiOnlyIfSmaller ?? true}
              onChange={() => handleAiOptionChange('aiOnlyIfSmaller', !(options.aiOnlyIfSmaller ?? true))}
              className="w-4 h-4 text-primary-600 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded focus:ring-primary-500"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              AI only if faster/smaller (recommended)
            </span>
          </label>
        )}

        <p className="text-xs text-gray-500 dark:text-gray-400 break-words">
          AI processing uses the configured API endpoint (VITE_AI_IMAGE_API_URL).
          Images above {aiMaxMegapixels}MP use standard compression automatically.
          AI may fall back if results are larger or too slow.
        </p>
        {options.aiMode !== 'none' && aiPixelLimitReached && (
          <p className="mt-2 text-xs text-amber-500 dark:text-amber-400">
            AI is disabled for this image ({(previewPixels / 1_000_000).toFixed(1)}MP).
          </p>
        )}
      </Section>
    </div>
  );
};
