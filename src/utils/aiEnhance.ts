import { ConvertOptions, OutputFormat } from '../types';

const getAiApiUrl = (): string | null => {
  return import.meta.env.VITE_AI_IMAGE_API_URL || null;
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

  const allowedFormats = new Set<OutputFormat>(['png', 'jpeg', 'webp']);
  if (!allowedFormats.has(outputFormat)) {
    throw new Error('AI enhancements support only PNG, JPEG, or WebP output formats.');
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

  const controller = new AbortController();
  const timeoutMs = options.aiMode === 'upscale' ? 180_000 : 90_000;
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  let response: Response;
  try {
    response = await fetch(apiUrl, {
      method: 'POST',
      body: formData,
      signal: controller.signal,
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('AI request timed out. Please try again.');
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    const rawMessage = await response.text().catch(() => '');
    const plainMessage = rawMessage
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    const isTimeoutStatus = response.status === 504;
    const hasTimeoutHint = plainMessage.toLowerCase().includes('gateway time-out')
      || plainMessage.toLowerCase().includes('timeout');
    if (isTimeoutStatus || hasTimeoutHint) {
      throw new Error('AI request timed out. Please try again.');
    }
    const friendlyMessage = plainMessage.slice(0, 160);
    throw new Error(friendlyMessage || `AI enhancement failed (${response.status})`);
  }

  return response.blob();
};
