const CONTENT_TYPE_EXT: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/avif': '.avif',
  'image/heic': '.heic',
  'image/heif': '.heif',
  'image/gif': '.gif',
  'image/bmp': '.bmp',
  'image/tiff': '.tif',
};

const sanitizeFilename = (name: string): string => {
  return name.replace(/[\\/:*?"<>|]/g, '_');
};

const getExtensionFromContentType = (contentType?: string): string => {
  if (!contentType) return '';
  const normalized = contentType.split(';')[0].trim().toLowerCase();
  return CONTENT_TYPE_EXT[normalized] || '';
};

export const getFilenameFromUrl = (url: string, contentType?: string): string => {
  try {
    const parsed = new URL(url);
    const pathname = decodeURIComponent(parsed.pathname);
    const lastSegment = pathname.split('/').filter(Boolean).pop() || 'imported-image';
    const hasExtension = /\.[a-zA-Z0-9]+$/.test(lastSegment);
    const extFromType = getExtensionFromContentType(contentType);

    if (hasExtension) {
      return sanitizeFilename(lastSegment);
    }

    return sanitizeFilename(`${lastSegment}${extFromType || '.jpg'}`);
  } catch {
    const fallbackExt = getExtensionFromContentType(contentType) || '.jpg';
    return `imported-image${fallbackExt}`;
  }
};

const buildProxyUrl = (proxyBase: string, targetUrl: string): string => {
  if (proxyBase.includes('{url}')) {
    return proxyBase.replace('{url}', encodeURIComponent(targetUrl));
  }
  const separator = proxyBase.includes('?') ? '&' : '?';
  return `${proxyBase}${separator}url=${encodeURIComponent(targetUrl)}`;
};

export const fetchImageFromUrl = async (
  url: string,
  useProxy: boolean,
  proxyBase?: string
): Promise<File> => {
  const targetUrl = useProxy && proxyBase ? buildProxyUrl(proxyBase, url) : url;
  const response = await fetch(targetUrl, {
    mode: 'cors',
    credentials: 'omit',
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch image (HTTP ${response.status})`);
  }

  const contentType = response.headers.get('content-type') || '';
  const blob = await response.blob();
  const filename = getFilenameFromUrl(url, contentType);
  const type = contentType || blob.type || 'application/octet-stream';

  return new File([blob], filename, { type });
};
