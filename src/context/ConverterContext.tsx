import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { SelectedFile, ConvertOptions, PresetType, OutputFormat, ImageTransform } from '../types';
import { DEFAULT_QUALITY } from '../constants';

interface ConverterState {
  files: SelectedFile[];
  activeFileId: string | null;
  options: ConvertOptions;
  isConverting: boolean;
  totalConversions: number;
  editHistoryByFileId: Record<string, { past: ImageTransform[]; future: ImageTransform[] }>;
}

type ConverterAction =
  | { type: 'ADD_FILES'; payload: SelectedFile[] }
  | { type: 'REMOVE_FILE'; payload: string }
  | { type: 'CLEAR_FILES' }
  | { type: 'UPDATE_FILE'; payload: { id: string; updates: Partial<SelectedFile> } }
  | { type: 'UPDATE_FILE_TRANSFORM'; payload: { id: string; transform: ImageTransform } }
  | { type: 'UNDO_TRANSFORM'; payload: { id: string } }
  | { type: 'REDO_TRANSFORM'; payload: { id: string } }
  | { type: 'MOVE_FILE'; payload: { sourceId: string; targetId: string } }
  | { type: 'SET_OPTIONS'; payload: Partial<ConvertOptions> }
  | { type: 'SET_PRESET'; payload: PresetType }
  | { type: 'SET_OUTPUT_FORMAT'; payload: OutputFormat }
  | { type: 'SET_CONVERTING'; payload: boolean }
  | { type: 'SET_ACTIVE_FILE'; payload: string | null }
  | { type: 'INCREMENT_CONVERSIONS'; payload: number };

const initialOptions: ConvertOptions = {
  quality: DEFAULT_QUALITY,
  lossless: false,
  maintainAspectRatio: true,
  stripMetadata: true,
  preset: 'custom',
  outputFormat: 'webp',
  namePrefix: '',
  nameSuffix: '',
  addTimestamp: false,
  addDimensions: false,
  addSequence: false,
  renameSequenceStart: 1,
  renameSequencePad: 0,
  renamePattern: '{prefix}{name}{suffix}{timestamp}{dimensions}{seq}',
  preserveMetadata: false,
  useWasmEncoders: false,
  aiMode: 'none',
  aiScale: 2,
  aiQuality: 80,
  aiOnlyIfSmaller: true,
  aiMaxPixels: 12_000_000,
};

// Load total conversions from localStorage
const loadTotalConversions = (): number => {
  try {
    const stored = localStorage.getItem('image-tools-total-conversions');
    return stored ? parseInt(stored, 10) : 0;
  } catch {
    return 0;
  }
};

// Save total conversions to localStorage
const saveTotalConversions = (count: number): void => {
  try {
    localStorage.setItem('image-tools-total-conversions', count.toString());
  } catch {
    // Ignore localStorage errors
  }
};

const initialState: ConverterState = {
  files: [],
  activeFileId: null,
  options: initialOptions,
  isConverting: false,
  totalConversions: loadTotalConversions(),
  editHistoryByFileId: {},
};

const defaultTransform: ImageTransform = {
  rotation: 0,
  flipHorizontal: false,
  flipVertical: false,
  filters: {
    brightness: 100,
    contrast: 100,
    saturation: 100,
    clarity: 0,
    vibrance: 0,
    highlights: 0,
    shadows: 0,
    temperature: 0,
    sharpen: 0,
    blur: 0,
    grayscale: false,
    sepia: false,
  },
};

const ensureTransform = (transform: ImageTransform | undefined): ImageTransform => {
  if (!transform) return { ...defaultTransform };
  return {
    ...defaultTransform,
    ...transform,
    filters: {
      ...defaultTransform.filters,
      ...transform.filters,
    },
  };
};

const converterReducer = (state: ConverterState, action: ConverterAction): ConverterState => {
  switch (action.type) {
    case 'ADD_FILES':
      const newFiles = [...state.files, ...action.payload];
      const newHistory = { ...state.editHistoryByFileId };
      action.payload.forEach((file) => {
        if (!newHistory[file.id]) {
          newHistory[file.id] = { past: [], future: [] };
        }
      });
      return {
        ...state,
        files: newFiles,
        // Set first file as active if no active file exists
        activeFileId: state.activeFileId || (newFiles.length > 0 ? newFiles[0].id : null),
        editHistoryByFileId: newHistory,
      };

    case 'REMOVE_FILE':
      const remainingFiles = state.files.filter((f) => f.id !== action.payload);
      const historyAfterRemove = { ...state.editHistoryByFileId };
      delete historyAfterRemove[action.payload];
      return {
        ...state,
        files: remainingFiles,
        // If removed file was active, set first remaining file as active
        activeFileId: state.activeFileId === action.payload
          ? (remainingFiles.length > 0 ? remainingFiles[0].id : null)
          : state.activeFileId,
        editHistoryByFileId: historyAfterRemove,
      };

    case 'CLEAR_FILES':
      return {
        ...state,
        files: [],
        activeFileId: null,
        editHistoryByFileId: {},
      };

    case 'UPDATE_FILE':
      return {
        ...state,
        files: state.files.map((f) =>
          f.id === action.payload.id ? { ...f, ...action.payload.updates } : f
        ),
      };
    case 'UPDATE_FILE_TRANSFORM': {
      const { id, transform } = action.payload;
      const history = state.editHistoryByFileId[id] || { past: [], future: [] };
      const currentFile = state.files.find((f) => f.id === id);
      const currentTransform = ensureTransform(currentFile?.transform);
      return {
        ...state,
        files: state.files.map((f) =>
          f.id === id ? { ...f, transform } : f
        ),
        editHistoryByFileId: {
          ...state.editHistoryByFileId,
          [id]: {
            past: [...history.past, currentTransform],
            future: [],
          },
        },
      };
    }
    case 'UNDO_TRANSFORM': {
      const { id } = action.payload;
      const history = state.editHistoryByFileId[id];
      if (!history || history.past.length === 0) return state;
      const currentFile = state.files.find((f) => f.id === id);
      const currentTransform = ensureTransform(currentFile?.transform);
      const previous = history.past[history.past.length - 1];
      const newPast = history.past.slice(0, -1);
      return {
        ...state,
        files: state.files.map((f) =>
          f.id === id ? { ...f, transform: previous } : f
        ),
        editHistoryByFileId: {
          ...state.editHistoryByFileId,
          [id]: {
            past: newPast,
            future: [currentTransform, ...history.future],
          },
        },
      };
    }
    case 'REDO_TRANSFORM': {
      const { id } = action.payload;
      const history = state.editHistoryByFileId[id];
      if (!history || history.future.length === 0) return state;
      const currentFile = state.files.find((f) => f.id === id);
      const currentTransform = ensureTransform(currentFile?.transform);
      const next = history.future[0];
      const newFuture = history.future.slice(1);
      return {
        ...state,
        files: state.files.map((f) =>
          f.id === id ? { ...f, transform: next } : f
        ),
        editHistoryByFileId: {
          ...state.editHistoryByFileId,
          [id]: {
            past: [...history.past, currentTransform],
            future: newFuture,
          },
        },
      };
    }

    case 'MOVE_FILE': {
      const { sourceId, targetId } = action.payload;
      if (sourceId === targetId) return state;
      const sourceIndex = state.files.findIndex((f) => f.id === sourceId);
      const targetIndex = state.files.findIndex((f) => f.id === targetId);
      if (sourceIndex === -1 || targetIndex === -1) return state;
      const reordered = [...state.files];
      const [moved] = reordered.splice(sourceIndex, 1);
      reordered.splice(targetIndex, 0, moved);
      return {
        ...state,
        files: reordered,
      };
    }

    case 'SET_OPTIONS':
      return {
        ...state,
        options: { 
          ...state.options, 
          ...action.payload
        },
      };

    case 'SET_PRESET':
      return {
        ...state,
        options: { ...state.options, preset: action.payload },
      };

    case 'SET_OUTPUT_FORMAT':
      return {
        ...state,
        options: { ...state.options, outputFormat: action.payload },
      };

    case 'SET_CONVERTING':
      return {
        ...state,
        isConverting: action.payload,
      };

    case 'SET_ACTIVE_FILE':
      return {
        ...state,
        activeFileId: action.payload,
      };

    case 'INCREMENT_CONVERSIONS':
      const newCount = state.totalConversions + action.payload;
      saveTotalConversions(newCount);
      return {
        ...state,
        totalConversions: newCount,
      };

    default:
      return state;
  }
};

interface ConverterContextType {
  state: ConverterState;
  dispatch: React.Dispatch<ConverterAction>;
}

const ConverterContext = createContext<ConverterContextType | undefined>(undefined);

export const ConverterProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(converterReducer, initialState);

  return (
    <ConverterContext.Provider value={{ state, dispatch }}>
      {children}
    </ConverterContext.Provider>
  );
};

export const useConverter = (): ConverterContextType => {
  const context = useContext(ConverterContext);
  if (!context) {
    throw new Error('useConverter must be used within a ConverterProvider');
  }
  return context;
};
