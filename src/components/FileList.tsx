import React from 'react';
import { Trash2, Copy, ListChecks } from 'lucide-react';
import { FileItem } from './FileItem';
import { useFileSelection } from '../hooks/useFileSelection';
import { useConverter } from '../context/ConverterContext';
import { useDuplicateDetection } from '../hooks/useDuplicateDetection';
import toast from 'react-hot-toast';

export const FileList: React.FC = () => {
  const {
    files,
    removeFile,
    clearFiles,
    toggleFileSelection,
    selectAll,
    deselectAll,
    moveFile,
    moveFileByOffset,
  } = useFileSelection();
  const { state } = useConverter();
  const { hasDuplicates, duplicateCount, isDuplicate, getDuplicateIdsToRemove } = useDuplicateDetection(files);

  if (files.length === 0) {
    return null;
  }

  const selectedCount = files.filter((f) => f.selected).length;
  const allSelected = selectedCount === files.length;

  const handleRemoveDuplicates = () => {
    const idsToRemove = getDuplicateIdsToRemove();
    idsToRemove.forEach((id) => {
      removeFile(id);
    });
    toast.success(`Removed ${idsToRemove.length} duplicate file(s)`);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <ListChecks className="h-4 w-4 text-primary-400" />
            Selected Files ({files.length})
          </h2>
          {selectedCount > 0 && (
            <span className="text-sm text-primary-600 dark:text-primary-400">
              {selectedCount} selected
            </span>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {hasDuplicates && (
            <button
              onClick={handleRemoveDuplicates}
              className="flex items-center gap-1 text-xs sm:text-sm text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300 font-medium"
              title={`Remove ${duplicateCount - (files.length - getDuplicateIdsToRemove().length)} duplicate files`}
            >
              <Copy className="w-4 h-4" />
              Remove Duplicates ({getDuplicateIdsToRemove().length})
            </button>
          )}
          <button
            onClick={allSelected ? deselectAll : selectAll}
            className="text-xs sm:text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
          >
            {allSelected ? 'Deselect All' : 'Select All'}
          </button>
          <button
            onClick={clearFiles}
            className="flex items-center gap-1 text-xs sm:text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
          >
            <Trash2 className="w-4 h-4" />
            Clear All
          </button>
        </div>
      </div>

      <div className="space-y-2 max-h-72 sm:max-h-80 overflow-y-auto p-1 -m-1 custom-scrollbar">
        {files.map((file) => (
          <FileItem 
            key={file.id} 
            file={file} 
            onRemove={removeFile}
            onToggleSelect={toggleFileSelection}
            onMove={moveFile}
            onMoveUp={(id) => moveFileByOffset(id, -1)}
            onMoveDown={(id) => moveFileByOffset(id, 1)}
            isActive={file.id === state.activeFileId}
            isDuplicate={isDuplicate(file.id)}
          />
        ))}
      </div>
    </div>
  );
};
