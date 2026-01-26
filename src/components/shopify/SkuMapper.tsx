/**
 * SKU Mapper Component
 * Configure SKU patterns and preview file-to-product matching
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Settings2,
  FileText,
  Package,
  Check,
  X,
  AlertCircle,
  Loader2,
  RefreshCw,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import {
  shopifyApi,
  type SkuMappingConfig,
  type PatternType,
  type SeparatorType,
  type SkuMatchResult,
} from '../../services/shopifyApi';
import { useShopify } from '../../context/ShopifyContext';
import { ProductSearch } from './ProductSearch';
import type { ShopifyProduct } from '../../services/shopifyApi';

interface SkuMapperProps {
  filenames: string[];
  onMappingComplete: (results: SkuMatchResult[]) => void;
  onCancel: () => void;
}

// Pattern descriptions for UI
const PATTERN_OPTIONS: Array<{
  value: PatternType;
  label: string;
  description: string;
  example: string;
}> = [
  {
    value: 'sku-prefix',
    label: 'SKU at Start',
    description: 'SKU appears at the beginning of filename',
    example: 'ABC123-product-photo.jpg → SKU: ABC123',
  },
  {
    value: 'sku-suffix',
    label: 'SKU at End',
    description: 'SKU appears at the end of filename',
    example: 'product-photo-ABC123.jpg → SKU: ABC123',
  },
  {
    value: 'handle',
    label: 'Product Handle',
    description: 'Filename matches product URL handle',
    example: 'red-sneakers-running.jpg → handle: red-sneakers-running',
  },
  {
    value: 'sku-anywhere',
    label: 'SKU Anywhere',
    description: 'Look for "SKU" prefix anywhere in filename',
    example: 'photo-SKU12345-front.jpg → SKU: 12345',
  },
  {
    value: 'custom',
    label: 'Custom Pattern',
    description: 'Define your own regex pattern',
    example: 'Use capture group: (\\w+)-product',
  },
];

const SEPARATOR_OPTIONS: Array<{ value: SeparatorType; label: string }> = [
  { value: '-', label: 'Dash (-)' },
  { value: '_', label: 'Underscore (_)' },
  { value: '.', label: 'Dot (.)' },
];

export function SkuMapper({ filenames, onMappingComplete, onCancel }: SkuMapperProps) {
  const { activeConnection } = useShopify();
  
  // Config state
  const [config, setConfig] = useState<SkuMappingConfig>({
    pattern: 'sku-prefix',
    separator: '-',
    extractPosition: true,
  });
  
  // Results state
  const [results, setResults] = useState<SkuMatchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Manual mapping state
  const [manualMappings, setManualMappings] = useState<Record<string, ShopifyProduct>>({});
  const [editingFile, setEditingFile] = useState<string | null>(null);
  
  // Expand/collapse state
  const [showConfig, setShowConfig] = useState(true);
  const [showMatched, setShowMatched] = useState(true);
  const [showUnmatched, setShowUnmatched] = useState(true);

  // Run mapping when config changes or filenames change
  const runMapping = useCallback(async () => {
    if (!activeConnection || filenames.length === 0) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await shopifyApi.mapFilesToProducts(
        activeConnection.id,
        filenames,
        config
      );
      setResults(response.results);
    } catch (err) {
      console.error('[SkuMapper] Mapping failed:', err);
      setError(err instanceof Error ? err.message : 'Mapping failed');
    } finally {
      setIsLoading(false);
    }
  }, [activeConnection, filenames, config]);

  // Initial mapping
  useEffect(() => {
    runMapping();
  }, [runMapping]);

  // Apply manual mappings to results
  const finalResults = useMemo(() => {
    return results.map((result) => {
      const manualProduct = manualMappings[result.filename];
      if (manualProduct) {
        return {
          ...result,
          matched: true,
          product: {
            id: manualProduct.id,
            title: manualProduct.title,
            handle: manualProduct.handle,
            sku: manualProduct.variants[0]?.sku || null,
            featuredImage: manualProduct.featuredImage?.url || null,
          },
          matchType: 'manual' as const,
        };
      }
      return result;
    });
  }, [results, manualMappings]);

  // Summary stats
  const summary = useMemo(() => {
    const matched = finalResults.filter((r) => r.matched).length;
    return {
      total: finalResults.length,
      matched,
      unmatched: finalResults.length - matched,
    };
  }, [finalResults]);

  // Grouped results
  const matchedResults = useMemo(
    () => finalResults.filter((r) => r.matched),
    [finalResults]
  );
  const unmatchedResults = useMemo(
    () => finalResults.filter((r) => !r.matched),
    [finalResults]
  );

  // Handle manual product selection
  const handleManualSelect = (filename: string, product: ShopifyProduct) => {
    setManualMappings((prev) => ({
      ...prev,
      [filename]: product,
    }));
    setEditingFile(null);
  };

  // Clear manual mapping
  const handleClearManual = (filename: string) => {
    setManualMappings((prev) => {
      const { [filename]: _, ...rest } = prev;
      return rest;
    });
  };

  // Confirm and continue
  const handleConfirm = () => {
    onMappingComplete(finalResults);
  };

  if (!activeConnection) {
    return (
      <div className="p-6 text-center">
        <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-3" />
        <p className="text-gray-600 dark:text-gray-400">
          Please connect a Shopify store first
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            SKU Mapping
          </h3>
          <button
            onClick={onCancel}
            className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Map {filenames.length} file(s) to Shopify products
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Pattern Configuration */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <button
            onClick={() => setShowConfig(!showConfig)}
            className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Settings2 className="w-5 h-5 text-gray-500" />
              <span className="font-medium text-gray-900 dark:text-white">
                Pattern Configuration
              </span>
            </div>
            {showConfig ? (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronRight className="w-5 h-5 text-gray-400" />
            )}
          </button>

          {showConfig && (
            <div className="p-4 pt-0 space-y-4">
              {/* Pattern Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Pattern Type
                </label>
                <div className="space-y-2">
                  {PATTERN_OPTIONS.map((option) => (
                    <label
                      key={option.value}
                      className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                        config.pattern === option.value
                          ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                          : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                      }`}
                    >
                      <input
                        type="radio"
                        name="pattern"
                        value={option.value}
                        checked={config.pattern === option.value}
                        onChange={(e) =>
                          setConfig((prev) => ({
                            ...prev,
                            pattern: e.target.value as PatternType,
                          }))
                        }
                        className="mt-0.5 text-green-600 focus:ring-green-500"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {option.label}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          {option.description}
                        </div>
                        <div className="text-xs text-gray-400 dark:text-gray-500 mt-1 font-mono">
                          {option.example}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Separator */}
              {(config.pattern === 'sku-prefix' || config.pattern === 'sku-suffix') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Separator Character
                  </label>
                  <div className="flex gap-2">
                    {SEPARATOR_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        onClick={() =>
                          setConfig((prev) => ({ ...prev, separator: option.value }))
                        }
                        className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                          config.separator === option.value
                            ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                            : 'border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-gray-300'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Custom Regex */}
              {config.pattern === 'custom' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Custom Regex Pattern
                  </label>
                  <input
                    type="text"
                    value={config.customRegex || ''}
                    onChange={(e) =>
                      setConfig((prev) => ({ ...prev, customRegex: e.target.value }))
                    }
                    placeholder="e.g., ^([A-Z0-9]+)-.*"
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm font-mono"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Use a capture group () for the identifier
                  </p>
                </div>
              )}

              {/* Extract Position */}
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.extractPosition}
                  onChange={(e) =>
                    setConfig((prev) => ({ ...prev, extractPosition: e.target.checked }))
                  }
                  className="rounded text-green-600 focus:ring-green-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Extract position number from filename (e.g., _1, _2)
                </span>
              </label>

              {/* Re-run button */}
              <button
                onClick={runMapping}
                disabled={isLoading}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors disabled:opacity-50"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
                Re-analyze Files
              </button>
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
              <AlertCircle className="w-5 h-5" />
              <span className="text-sm font-medium">{error}</span>
            </div>
          </div>
        )}

        {/* Summary */}
        {!isLoading && results.length > 0 && (
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3 text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {summary.total}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Total Files</div>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-3 text-center">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {summary.matched}
              </div>
              <div className="text-xs text-green-600 dark:text-green-400">Matched</div>
            </div>
            <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-xl p-3 text-center">
              <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                {summary.unmatched}
              </div>
              <div className="text-xs text-yellow-600 dark:text-yellow-400">Unmatched</div>
            </div>
          </div>
        )}

        {/* Loading */}
        {isLoading && (
          <div className="p-8 text-center">
            <Loader2 className="w-8 h-8 text-green-500 animate-spin mx-auto mb-3" />
            <p className="text-sm text-gray-500">Analyzing files and matching to products...</p>
          </div>
        )}

        {/* Matched Results */}
        {!isLoading && matchedResults.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <button
              onClick={() => setShowMatched(!showMatched)}
              className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5 text-green-500" />
                <span className="font-medium text-gray-900 dark:text-white">
                  Matched ({matchedResults.length})
                </span>
              </div>
              {showMatched ? (
                <ChevronDown className="w-5 h-5 text-gray-400" />
              ) : (
                <ChevronRight className="w-5 h-5 text-gray-400" />
              )}
            </button>

            {showMatched && (
              <div className="border-t border-gray-200 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-700/50">
                {matchedResults.map((result) => (
                  <MatchResultRow
                    key={result.filename}
                    result={result}
                    onClearManual={
                      result.matchType === 'manual'
                        ? () => handleClearManual(result.filename)
                        : undefined
                    }
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Unmatched Results */}
        {!isLoading && unmatchedResults.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <button
              onClick={() => setShowUnmatched(!showUnmatched)}
              className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-yellow-500" />
                <span className="font-medium text-gray-900 dark:text-white">
                  Unmatched ({unmatchedResults.length})
                </span>
              </div>
              {showUnmatched ? (
                <ChevronDown className="w-5 h-5 text-gray-400" />
              ) : (
                <ChevronRight className="w-5 h-5 text-gray-400" />
              )}
            </button>

            {showUnmatched && (
              <div className="border-t border-gray-200 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-700/50">
                {unmatchedResults.map((result) => (
                  <UnmatchedRow
                    key={result.filename}
                    result={result}
                    isEditing={editingFile === result.filename}
                    onStartEdit={() => setEditingFile(result.filename)}
                    onCancelEdit={() => setEditingFile(null)}
                    onSelectProduct={(product) =>
                      handleManualSelect(result.filename, product)
                    }
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {summary.matched} of {summary.total} files will be uploaded with product mapping
          </p>
          <div className="flex gap-2">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={summary.matched === 0}
              className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed rounded-lg transition-colors"
            >
              Continue with {summary.matched} Matched
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Matched result row
 */
function MatchResultRow({
  result,
  onClearManual,
}: {
  result: SkuMatchResult;
  onClearManual?: () => void;
}) {
  return (
    <div className="flex items-center gap-3 p-3">
      <FileText className="w-5 h-5 text-gray-400 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
          {result.filename}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {result.parsed.identifier && (
            <span className="font-mono">ID: {result.parsed.identifier}</span>
          )}
          {result.parsed.position && (
            <span className="ml-2">Position: {result.parsed.position}</span>
          )}
        </p>
      </div>
      <div className="flex items-center gap-2">
        {result.product && (
          <div className="flex items-center gap-2 px-2 py-1 bg-green-50 dark:bg-green-900/20 rounded-lg">
            {result.product.featuredImage ? (
              <img
                src={result.product.featuredImage}
                alt=""
                className="w-6 h-6 rounded object-cover"
              />
            ) : (
              <Package className="w-6 h-6 text-gray-400" />
            )}
            <span className="text-xs font-medium text-green-700 dark:text-green-400 max-w-[150px] truncate">
              {result.product.title}
            </span>
          </div>
        )}
        <span
          className={`text-xs px-2 py-0.5 rounded ${
            result.matchType === 'manual'
              ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
              : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
          }`}
        >
          {result.matchType === 'manual' ? 'Manual' : result.matchType?.toUpperCase()}
        </span>
        {onClearManual && (
          <button
            onClick={onClearManual}
            className="p-1 text-gray-400 hover:text-red-500 rounded transition-colors"
            title="Remove manual mapping"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * Unmatched result row with manual selection
 */
function UnmatchedRow({
  result,
  isEditing,
  onStartEdit,
  onCancelEdit,
  onSelectProduct,
}: {
  result: SkuMatchResult;
  isEditing: boolean;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSelectProduct: (product: ShopifyProduct) => void;
}) {
  const [selectedProduct, setSelectedProduct] = useState<ShopifyProduct | null>(null);

  const handleSelect = (product: ShopifyProduct) => {
    setSelectedProduct(product);
    onSelectProduct(product);
  };

  return (
    <div className="p-3">
      <div className="flex items-center gap-3">
        <FileText className="w-5 h-5 text-gray-400 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
            {result.filename}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {result.parsed.identifier ? (
              <>
                <span className="font-mono">Extracted: {result.parsed.identifier}</span>
                <span className="ml-2 text-yellow-600 dark:text-yellow-400">
                  (No matching product)
                </span>
              </>
            ) : (
              <span className="text-yellow-600 dark:text-yellow-400">
                Could not extract identifier
              </span>
            )}
          </p>
        </div>
        {!isEditing && (
          <button
            onClick={onStartEdit}
            className="px-3 py-1.5 text-xs font-medium text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
          >
            Select Product
          </button>
        )}
      </div>

      {/* Manual product selection */}
      {isEditing && (
        <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <ProductSearch
            selectedProduct={selectedProduct}
            onSelect={handleSelect}
            onClear={() => setSelectedProduct(null)}
          />
          <div className="mt-2 flex justify-end">
            <button
              onClick={onCancelEdit}
              className="px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default SkuMapper;
