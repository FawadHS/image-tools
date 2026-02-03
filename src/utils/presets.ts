import { Preset, PresetType } from '../types';
import { PRESETS } from '../constants';

export const presets: Record<PresetType, Preset> = PRESETS;

export const getPreset = (id: PresetType): Preset => {
  return presets[id] || presets['custom'];
};

export const presetList = Object.values(presets);
