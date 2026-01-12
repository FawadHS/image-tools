import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { SelectedFile, ConvertOptions, PresetType, OutputFormat } from '../types';
import { DEFAULT_QUALITY } from '../constants';

interface ConverterState {
  files: SelectedFile[];
  activeFileId: string | null;
  options: ConvertOptions;
  isConverting: boolean;
  totalConversions: number;
}

type ConverterAction =
  | { type: 'ADD_FILES'; payload: SelectedFile[] }
  | { type: 'REMOVE_FILE'; payload: string }
  | { type: 'CLEAR_FILES' }
  | { type: 'UPDATE_FILE'; payload: { id: string; updates: Partial<SelectedFile> } }
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
};

const converterReducer = (state: ConverterState, action: ConverterAction): ConverterState => {
  switch (action.type) {
    case 'ADD_FILES':
      const newFiles = [...state.files, ...action.payload];
      return {
        ...state,
        files: newFiles,
        // Set first file as active if no active file exists
        activeFileId: state.activeFileId || (newFiles.length > 0 ? newFiles[0].id : null),
      };

    case 'REMOVE_FILE':
      const remainingFiles = state.files.filter((f) => f.id !== action.payload);
      return {
        ...state,
        files: remainingFiles,
        // If removed file was active, set first remaining file as active
        activeFileId: state.activeFileId === action.payload
          ? (remainingFiles.length > 0 ? remainingFiles[0].id : null)
          : state.activeFileId,
      };

    case 'CLEAR_FILES':
      return {
        ...state,
        files: [],
        activeFileId: null,
      };

    case 'UPDATE_FILE':
      return {
        ...state,
        files: state.files.map((f) =>
          f.id === action.payload.id ? { ...f, ...action.payload.updates } : f
        ),
      };

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
