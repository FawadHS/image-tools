import { ConvertOptions } from '../types';

const INVALID_FILENAME_CHARS = /[\\/:*?"<>|]/g;

const formatDate = (): string => {
  return new Date().toISOString().split('T')[0];
};

export const buildOutputFilename = (
  originalFilename: string,
  extension: string,
  width: number,
  height: number,
  options: ConvertOptions
): string => {
  const originalName = originalFilename.replace(/\.[^/.]+$/, '');
  const pattern = (options.renamePattern && options.renamePattern.trim())
    ? options.renamePattern
    : '{prefix}{name}{suffix}{timestamp}{dimensions}{seq}';

  const sequenceValue = options.renameSequence ?? options.renameSequenceStart ?? 1;
  const pad = options.renameSequencePad ?? 0;
  const seqString = pad > 0 ? String(sequenceValue).padStart(pad, '0') : String(sequenceValue);

  const timestamp = options.addTimestamp ? `_${formatDate()}` : '';
  const dimensions = options.addDimensions ? `_${width}x${height}` : '';
  const seq = options.addSequence ? `_${seqString}` : '';
  const extDot = extension.startsWith('.') ? extension : `.${extension}`;
  const extBare = extDot.slice(1);

  const hasExtToken = pattern.includes('{ext}') || pattern.includes('{extDot}');

  let filename = pattern
    .replaceAll('{name}', originalName)
    .replaceAll('{prefix}', options.namePrefix || '')
    .replaceAll('{suffix}', options.nameSuffix || '')
    .replaceAll('{timestamp}', timestamp)
    .replaceAll('{date}', timestamp)
    .replaceAll('{dimensions}', dimensions)
    .replaceAll('{width}', String(width))
    .replaceAll('{height}', String(height))
    .replaceAll('{seq}', seq)
    .replaceAll('{ext}', extBare)
    .replaceAll('{extDot}', extDot);

  if (!hasExtToken) {
    filename = `${filename}${extDot}`;
  }

  filename = filename.replace(INVALID_FILENAME_CHARS, '_');

  return filename;
};
