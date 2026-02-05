import { ConvertOptions, OutputFormat } from '../types';

const getAiApiUrl = (): string | null => {
  return import.meta.env.VITE_AI_IMAGE_API_URL || null;
};

const buildAsyncBaseUrl = (apiUrl: string): string => {
  try {
    const url = new URL(apiUrl, window.location.origin);
    if (url.pathname.endsWith('/image')) {
      url.pathname = url.pathname.replace(/\/image$/, '/image-async');
    } else if (!url.pathname.endsWith('/image-async')) {
      url.pathname = `${url.pathname.replace(/\/$/, '')}/image-async`;
    }
    return url.toString();
  } catch {
    if (apiUrl.endsWith('/image')) {
      return apiUrl.replace(/\/image$/, '/image-async');
    }
    return apiUrl.replace(/\/$/, '') + '/image-async';
  }
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const getPlainErrorMessage = async (response: Response) => {
  const rawMessage = await response.text().catch(() => '');
  const plainMessage = rawMessage
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const isTimeoutStatus = response.status === 504;
  const hasTimeoutHint =
    plainMessage.toLowerCase().includes('gateway time-out') ||
    plainMessage.toLowerCase().includes('timeout');
  if (isTimeoutStatus || hasTimeoutHint) {
    return 'AI request timed out. Please try again.';
  }
  const friendlyMessage = plainMessage.slice(0, 160);
  return friendlyMessage || `AI enhancement failed (${response.status})`;
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

  const asyncBaseUrl = buildAsyncBaseUrl(apiUrl);
  const asyncTimeoutMs = options.aiMode === 'upscale' ? 420_000 : 240_000;
  const requestTimeoutMs = 20_000;
  const startTime = Date.now();

  const trySync = async () => {
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
      const message = await getPlainErrorMessage(response);
      throw new Error(message);
    }

    return response.blob();
  };

  try {
    const asyncResponse = await fetch(asyncBaseUrl, {
      method: 'POST',
      body: formData,
    });

    if (asyncResponse.status === 404 || asyncResponse.status === 405) {
      return await trySync();
    }

    if (!asyncResponse.ok) {
      const message = await getPlainErrorMessage(asyncResponse);
      throw new Error(message);
    }

    const asyncPayload = (await asyncResponse.json().catch(() => ({}))) as { jobId?: string; status?: string };
    if (!asyncPayload.jobId) {
      throw new Error('AI request failed to start. Please try again.');
    }

    const statusUrl = `${asyncBaseUrl.replace(/\/$/, '')}/${asyncPayload.jobId}`;
    const resultUrl = `${statusUrl}/result`;
    let pollDelay = 1000;
    while (Date.now() - startTime < asyncTimeoutMs) {
      const statusController = new AbortController();
      const statusTimeout = setTimeout(() => statusController.abort(), requestTimeoutMs);
      let statusResponse: Response;
      try {
        statusResponse = await fetch(statusUrl, { cache: 'no-store', signal: statusController.signal });
      } catch {
        statusResponse = null as unknown as Response;
      } finally {
        clearTimeout(statusTimeout);
      }

      if (statusResponse && statusResponse.ok) {
        const statusPayload = (await statusResponse.json().catch(() => ({}))) as { status?: string; error?: string };
        if (statusPayload.status === 'done') {
          const resultResponse = await fetch(resultUrl, { cache: 'no-store' });
          if (!resultResponse.ok) {
            const message = await getPlainErrorMessage(resultResponse);
            throw new Error(message);
          }
          return resultResponse.blob();
        }
        if (statusPayload.status === 'error') {
          throw new Error(statusPayload.error || 'AI request failed. Please try again.');
        }
      } else if (statusResponse && statusResponse.status === 404) {
        throw new Error('AI request expired. Please try again.');
      }

      await sleep(pollDelay);
      pollDelay = Math.min(pollDelay + 500, 5000);
    }

    throw new Error('AI request timed out. Please try again.');
  } catch (error) {
    if (error instanceof Error && error.message.includes('timed out')) {
      throw error;
    }
    throw error;
  }
};
