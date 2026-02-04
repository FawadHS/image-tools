const dataUrlToBlob = (dataUrl: string): Blob => {
  const [header, data] = dataUrl.split(',');
  const mimeMatch = header.match(/data:(.*);base64/);
  const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
  const binary = atob(data);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mime });
};

export const maybePreserveMetadata = async (
  outputBlob: Blob,
  originalFile: File,
  outputFormat: string,
  options: { preserveMetadata?: boolean }
): Promise<Blob> => {
  if (!options?.preserveMetadata) return outputBlob;
  if (outputFormat !== 'jpeg') return outputBlob;

  const isJpegInput =
    originalFile.type === 'image/jpeg' ||
    originalFile.name.toLowerCase().endsWith('.jpg') ||
    originalFile.name.toLowerCase().endsWith('.jpeg');
  if (!isJpegInput) return outputBlob;

  try {
    const piexif = await import('piexifjs');
    const originalDataUrl = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error('Failed to read original file metadata'));
      reader.readAsDataURL(originalFile);
    });

    const outputDataUrl = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error('Failed to read output for metadata insert'));
      reader.readAsDataURL(outputBlob);
    });

    const exifData = piexif.load(originalDataUrl);
    if (exifData['0th'] && piexif.ImageIFD?.Orientation) {
      exifData['0th'][piexif.ImageIFD.Orientation] = 1;
    }
    const exifBytes = piexif.dump(exifData);
    const mergedDataUrl = piexif.insert(exifBytes, outputDataUrl);
    return dataUrlToBlob(mergedDataUrl);
  } catch {
    return outputBlob;
  }
};
