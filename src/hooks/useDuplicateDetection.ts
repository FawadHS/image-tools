import { useMemo } from 'react';
import { SelectedFile } from '../types';

export interface DuplicateGroup {
  key: string; // filename + size combination
  fileIds: string[];
}

/**
 * Detects duplicate files based on filename and file size.
 * Returns a map of fileId -> duplicateGroupKey for files that have duplicates.
 */
export const useDuplicateDetection = (files: SelectedFile[]) => {
  const { duplicateMap, duplicateGroups, duplicateCount } = useMemo(() => {
    // Group files by filename + size
    const groups = new Map<string, string[]>();
    
    files.forEach((file) => {
      const key = `${file.file.name}-${file.file.size}`;
      const existing = groups.get(key) || [];
      existing.push(file.id);
      groups.set(key, existing);
    });

    // Filter to only groups with more than 1 file (actual duplicates)
    const duplicateGroups: DuplicateGroup[] = [];
    const duplicateMap = new Map<string, string>();
    let duplicateCount = 0;

    groups.forEach((fileIds, key) => {
      if (fileIds.length > 1) {
        duplicateGroups.push({ key, fileIds });
        duplicateCount += fileIds.length;
        // Map each file ID to its duplicate group key
        fileIds.forEach((id) => duplicateMap.set(id, key));
      }
    });

    return { duplicateMap, duplicateGroups, duplicateCount };
  }, [files]);

  /**
   * Check if a file is a duplicate
   */
  const isDuplicate = (fileId: string): boolean => {
    return duplicateMap.has(fileId);
  };

  /**
   * Get all file IDs that are duplicates of the given file (excluding itself)
   */
  const getDuplicatesOf = (fileId: string): string[] => {
    const key = duplicateMap.get(fileId);
    if (!key) return [];
    
    const group = duplicateGroups.find((g) => g.key === key);
    if (!group) return [];
    
    return group.fileIds.filter((id) => id !== fileId);
  };

  /**
   * Get IDs of all duplicate files except the first occurrence in each group
   */
  const getDuplicateIdsToRemove = (): string[] => {
    const idsToRemove: string[] = [];
    duplicateGroups.forEach((group) => {
      // Keep the first file, mark the rest for removal
      group.fileIds.slice(1).forEach((id) => idsToRemove.push(id));
    });
    return idsToRemove;
  };

  return {
    duplicateMap,
    duplicateGroups,
    duplicateCount,
    hasDuplicates: duplicateGroups.length > 0,
    isDuplicate,
    getDuplicatesOf,
    getDuplicateIdsToRemove,
  };
};
