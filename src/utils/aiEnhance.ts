import { ConvertOptions, OutputFormat } from '../types';

const getAiApiUrl = (): string | null => {
  return import.meta.env.VITE_AI_IMAGE_API_URL || null;
};

const getAiApiKey = (): string | null => {
  return import.meta.env.VITE_AI_IMAGE_API_KEY || null;
};

export const runAiEnhancement = async (
  inputBlob: Blob,
  options: ConvertOptions,
  outputFormat: OutputFormat
): Promise<Blob> => {
  const apiUrl = getAiApiUrl();
  if (!apiUrl) {
    throw new Error('AI API is not configured. Set VITE_AI_IMAGE_API_URL to enable AI enhancements.');
  }

  if (!options.aiMode || options.aiMode === 'none') {
    return inputBlob;
  }

  const formData = new FormData();
  formData.append('image', inputBlob, 'input.png');
  formData.append('mode', options.aiMode);
  formData.append('outputFormat', outputFormat);
  if (options.aiScale) {
    formData.append('scale', String(options.aiScale));
  }
  if (options.aiQuality) {
    formData.append('quality', String(options.aiQuality));
  }

  const headers: Record<string, string> = {};
  const apiKey = getAiApiKey();
  if (apiKey) {
    headers.Authorization = `Bearer ${apiKey}`;
  }

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers,
    body: formData,
  });

  if (!response.ok) {
    const message = await response.text().catch(() => '');
    throw new Error(message || `AI enhancement failed (${response.status})`);
  }

  return response.blob();
};
