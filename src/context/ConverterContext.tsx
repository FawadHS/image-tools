import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { SelectedFile, ConvertOptions, PresetType, OutputFormat } from '../types';
import { DEFAULT_QUALITY } from '../constants';

interface ConverterState {
  files: SelectedFile[];
  options: ConvertOptions;
  isConverting: boolean;
}

type ConverterAction =
  | { type: 'ADD_FILES'; payload: SelectedFile[] }
  | { type: 'REMOVE_FILE'; payload: string }
  | { type: 'CLEAR_FILES' }
  | { type: 'UPDATE_FILE'; payload: { id: string; updates: Partial<SelectedFile> } }
  | { type: 'SET_OPTIONS'; payload: Partial<ConvertOptions> }
  | { type: 'SET_PRESET'; payload: PresetType }
  | { type: 'SET_OUTPUT_FORMAT'; payload: OutputFormat }
  | { type: 'SET_CONVERTING'; payload: boolean };

const initialOptions: ConvertOptions = {
  quality: DEFAULT_QUALITY,
  lossless: false,
  maintainAspectRatio: true,
  stripMetadata: true,
  preset: 'custom',
  outputFormat: 'webp',
};

const initialState: ConverterState = {
  files: [],
  options: initialOptions,
  isConverting: false,
};

const converterReducer = (state: ConverterState, action: ConverterAction): ConverterState => {
  switch (action.type) {
    case 'ADD_FILES':
      return {
        ...state,
        files: [...state.files, ...action.payload],
      };

    case 'REMOVE_FILE':
      return {
        ...state,
        files: state.files.filter((f) => f.id !== action.payload),
      };

    case 'CLEAR_FILES':
      return {
        ...state,
        files: [],
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
          ...action.payload,
          // Deep merge transform object to preserve crop/text/filters
          transform: action.payload.transform 
            ? { ...state.options.transform, ...action.payload.transform }
            : state.options.transform
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
