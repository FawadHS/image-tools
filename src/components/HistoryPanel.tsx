import React, { useState, useEffect } from 'react';
import { History, Trash2, TrendingDown, FileImage } from 'lucide-react';
import { getHistory, clearHistory, deleteHistoryRecord, getHistoryStats, HistoryRecord } from '../utils/history';
import { formatFileSize } from '../utils/fileUtils';

export const HistoryPanel: React.FC = () => {
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const [stats, setStats] = useState({ totalConversions: 0, totalSaved: 0, averageReduction: 0 });
  const [isExpanded, setIsExpanded] = useState(false);

  const loadHistory = () => {
    setHistory(getHistory());
    setStats(getHistoryStats());
  };

  useEffect(() => {
    loadHistory();

    // Listen for storage changes to update history in real-time
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'conversion-history') {
        loadHistory();
      }
    };

    // Custom event for same-window updates (since storage event doesn't fire in same window)
    const handleHistoryUpdate = () => {
      loadHistory();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('history-updated', handleHistoryUpdate);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('history-updated', handleHistoryUpdate);
    };
  }, []);

  const handleClear = () => {
    if (confirm('Clear all conversion history?')) {
      clearHistory();
      loadHistory();
    }
  };

  const handleDelete = (id: string) => {
    deleteHistoryRecord(id);
    loadHistory();
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  if (history.length === 0) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <History className="w-5 h-5 text-primary-600 dark:text-primary-400" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Conversion History
          </h2>
          <span className="px-2 py-0.5 bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 text-xs font-medium rounded-full">
            {history.length}
          </span>
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {isExpanded ? 'Hide' : 'Show'}
        </div>
      </button>

      {isExpanded && (
        <>
          {/* Stats */}
          <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900 grid grid-cols-3 gap-4">
            <div className="text-center">
              <FileImage className="w-4 h-4 mx-auto mb-1 text-gray-400" />
              <p className="text-xs text-gray-500 dark:text-gray-400">Total Files</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {stats.totalConversions}
              </p>
            </div>
            <div className="text-center">
              <TrendingDown className="w-4 h-4 mx-auto mb-1 text-green-500" />
              <p className="text-xs text-gray-500 dark:text-gray-400">Space Saved</p>
              <p className="text-lg font-semibold text-green-600 dark:text-green-400">
                {formatFileSize(stats.totalSaved)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Avg. Reduction</p>
              <p className="text-lg font-semibold text-primary-600 dark:text-primary-400">
                {stats.averageReduction}%
              </p>
            </div>
          </div>

          {/* History List */}
          <div className="max-h-96 overflow-y-auto pr-2 custom-scrollbar">
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {history.map((record) => (
                <div
                  key={record.id}
                  className="px-6 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {record.filename}
                    </p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {formatDate(record.timestamp)}
                      </span>
                      <span className="text-xs text-gray-400 dark:text-gray-500">•</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {formatFileSize(record.originalSize)} → {formatFileSize(record.convertedSize)}
                      </span>
                      <span className="text-xs font-medium text-green-600 dark:text-green-400">
                        -{record.reduction}%
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(record.id)}
                    className="ml-3 p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                    aria-label="Delete record"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Clear All Button */}
          <div className="px-6 py-3 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={handleClear}
              className="w-full px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
            >
              Clear All History
            </button>
          </div>
        </>
      )}
    </div>
  );
};
