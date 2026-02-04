import ExifReader from 'exifreader';

export interface ExifField {
  label: string;
  value: string;
}

const formatValue = (value: unknown): string => {
  if (value === undefined || value === null) return 'N/A';
  if (Array.isArray(value)) return value.join(', ');
  return String(value);
};

const toDecimal = (coord: number[], ref?: string): string => {
  if (!coord || coord.length < 3) return 'N/A';
  const [deg, min, sec] = coord;
  let decimal = deg + min / 60 + sec / 3600;
  if (ref === 'S' || ref === 'W') decimal *= -1;
  return decimal.toFixed(6);
};

export const readExifData = async (file: File): Promise<ExifField[]> => {
  try {
    const buffer = await file.arrayBuffer();
    const tags = ExifReader.load(buffer, { expanded: true });

    const gps = tags.gps || {};
    const exif = tags.exif || {};
    const image = tags.image || {};

    const gpsLat = gps?.GPSLatitude?.value as number[] | undefined;
    const gpsLatRef = gps?.GPSLatitudeRef?.value as string | undefined;
    const gpsLon = gps?.GPSLongitude?.value as number[] | undefined;
    const gpsLonRef = gps?.GPSLongitudeRef?.value as string | undefined;

    const fields: ExifField[] = [
      { label: 'Make', value: formatValue(image?.Make?.description || image?.Make?.value) },
      { label: 'Model', value: formatValue(image?.Model?.description || image?.Model?.value) },
      { label: 'Lens', value: formatValue(exif?.LensModel?.description || exif?.LensModel?.value) },
      { label: 'Captured', value: formatValue(exif?.DateTimeOriginal?.description || exif?.DateTimeOriginal?.value) },
      { label: 'Exposure', value: formatValue(exif?.ExposureTime?.description || exif?.ExposureTime?.value) },
      { label: 'Aperture', value: formatValue(exif?.FNumber?.description || exif?.FNumber?.value) },
      { label: 'ISO', value: formatValue(exif?.ISOSpeedRatings?.description || exif?.ISOSpeedRatings?.value) },
      { label: 'Focal Length', value: formatValue(exif?.FocalLength?.description || exif?.FocalLength?.value) },
      { label: 'Orientation', value: formatValue(image?.Orientation?.description || image?.Orientation?.value) },
    ];

    if (gpsLat && gpsLon) {
      fields.push({
        label: 'GPS',
        value: `${toDecimal(gpsLat, gpsLatRef)}, ${toDecimal(gpsLon, gpsLonRef)}`,
      });
    }

    return fields.filter((field) => field.value !== 'N/A');
  } catch {
    return [];
  }
};
