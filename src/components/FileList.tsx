import React from 'react';
import { Trash2 } from 'lucide-react';
import { FileItem } from './FileItem';
import { useFileSelection } from '../hooks/useFileSelection';
import { useConverter } from '../context/ConverterContext';

export const FileList: React.FC = () => {
  const { files, removeFile, clearFiles } = useFileSelection();
  const { state } = useConverter();

  if (files.length === 0) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Selected Files ({files.length})
        </h2>
        <button
          onClick={clearFiles}
          className="flex items-center gap-1 text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
        >
          <Trash2 className="w-4 h-4" />
          Clear All
        </button>
      </div>

      <div className="space-y-2 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
        {files.map((file) => (
          <FileItem 
            key={file.id} 
            file={file} 
            onRemove={removeFile}
            isActive={file.id === state.activeFileId}
          />
        ))}
      </div>
    </div>
  );
};
