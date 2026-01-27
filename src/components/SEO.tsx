import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  canonicalPath?: string;
  ogType?: string;
}

export const SEO: React.FC<SEOProps> = ({
  title = 'Image Preflight - Free HEIC to WebP Converter & Image Editor | Preflight Suite',
  description = 'Free online image converter and editor. Convert HEIC, JPEG, PNG, GIF, BMP, TIFF to WebP, AVIF, PNG, JPEG. Privacy-first with client-side processing, batch conversion, image editing tools, crop, rotate, flip, filters, and text overlay. No uploads, no tracking.',
  canonicalPath = '/',
  ogType = 'website',
}) => {
  const canonicalUrl = `https://tools.fawadhs.dev${canonicalPath}`;

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonicalUrl} />
      
      {/* Open Graph */}
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      
      {/* Twitter */}
      <meta property="twitter:url" content={canonicalUrl} />
      <meta property="twitter:title" content={title} />
      <meta property="twitter:description" content={description} />
    </Helmet>
  );
};
