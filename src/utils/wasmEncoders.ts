import { ConvertOptions, OutputFormat } from '../types';
import { getMimeType } from './imageHelpers';

const getImageData = (canvas: HTMLCanvasElement): ImageData | null => {
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  return ctx.getImageData(0, 0, canvas.width, canvas.height);
};

export const encodeWithWasm = async (
  canvas: HTMLCanvasElement,
  format: OutputFormat,
  options: ConvertOptions
): Promise<Blob | null> => {
  if (!options.useWasmEncoders) return null;
  if (format !== 'webp' && format !== 'avif') return null;

  const imageData = getImageData(canvas);
  if (!imageData) return null;

  const quality = options.lossless ? 100 : options.quality;

  try {
    if (format === 'webp') {
      const { encode } = await import('@jsquash/webp');
      const encoded = await encode(imageData, { quality });
      return new Blob([encoded], { type: getMimeType(format) });
    }

    const { encode } = await import('@jsquash/avif');
    const encoded = await encode(imageData, { quality, speed: 4 });
    return new Blob([encoded], { type: getMimeType(format) });
  } catch {
    return null;
  }
};
