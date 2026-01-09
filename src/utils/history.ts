/**
 * Conversion History Management
 * Stores conversion records in localStorage
 */

export interface HistoryRecord {
  id: string;
  timestamp: number;
  filename: string;
  originalSize: number;
  convertedSize: number;
  reduction: number;
  format: string;
  quality: number;
}

const HISTORY_KEY = 'image-tools-history';
const MAX_HISTORY = 50;

/**
 * Get all history records
 */
export const getHistory = (): HistoryRecord[] => {
  try {
    const data = localStorage.getItem(HISTORY_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Failed to load history:', error);
    return [];
  }
};

/**
 * Add a new history record
 */
export const addToHistory = (record: Omit<HistoryRecord, 'id' | 'timestamp'>): void => {
  try {
    const history = getHistory();
    const newRecord: HistoryRecord = {
      ...record,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
    };

    // Add to beginning and limit to MAX_HISTORY
    history.unshift(newRecord);
    const limitedHistory = history.slice(0, MAX_HISTORY);

    localStorage.setItem(HISTORY_KEY, JSON.stringify(limitedHistory));
    
    // Dispatch custom event to notify listeners (for same-window updates)
    window.dispatchEvent(new CustomEvent('history-updated'));
  } catch (error) {
    console.error('Failed to save history:', error);
  }
};

/**
 * Clear all history
 */
export const clearHistory = (): void => {
  try {
    localStorage.removeItem(HISTORY_KEY);
    window.dispatchEvent(new CustomEvent('history-updated'));
  } catch (error) {
    console.error('Failed to clear history:', error);
  }
};

/**
 * Delete a specific record
 */
export const deleteHistoryRecord = (id: string): void => {
  try {
    const history = getHistory();
    const filtered = history.filter(record => record.id !== id);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(filtered));
    window.dispatchEvent(new CustomEvent('history-updated'));
  } catch (error) {
    console.error('Failed to delete history record:', error);
  }
};

/**
 * Get history statistics
 */
export const getHistoryStats = () => {
  const history = getHistory();
  
  if (history.length === 0) {
    return {
      totalConversions: 0,
      totalSaved: 0,
      averageReduction: 0,
    };
  }

  const totalSaved = history.reduce(
    (sum, record) => sum + (record.originalSize - record.convertedSize),
    0
  );

  const averageReduction = history.reduce(
    (sum, record) => sum + record.reduction,
    0
  ) / history.length;

  return {
    totalConversions: history.length,
    totalSaved,
    averageReduction: Math.round(averageReduction),
  };
};
