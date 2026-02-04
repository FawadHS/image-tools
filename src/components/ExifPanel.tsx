import React, { useEffect, useState } from 'react';
import { useConverter } from '../context/ConverterContext';
import { readExifData, ExifField } from '../utils/exif';

export const ExifPanel: React.FC = () => {
  const { state } = useConverter();
  const { files, activeFileId } = state;
  const [fields, setFields] = useState<ExifField[]>([]);
  const [loading, setLoading] = useState(false);

  const activeFile = files.find((f) => f.id === activeFileId) || files[0];

  useEffect(() => {
    let isMounted = true;
    const loadExif = async () => {
      if (!activeFile) {
        setFields([]);
        return;
      }
      setLoading(true);
      const data = await readExifData(activeFile.file);
      if (isMounted) {
        setFields(data);
        setLoading(false);
      }
    };

    loadExif().catch(() => {
      if (isMounted) {
        setFields([]);
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [activeFile]);

  if (!activeFile) return null;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">EXIF Metadata</h2>
      {loading ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">Loading metadata...</p>
      ) : fields.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">No EXIF metadata found.</p>
      ) : (
        <dl className="space-y-2">
          {fields.map((field) => (
            <div key={field.label} className="flex items-start justify-between gap-4">
              <dt className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                {field.label}
              </dt>
              <dd className="text-sm text-gray-900 dark:text-white text-right break-words max-w-[60%]">
                {field.value}
              </dd>
            </div>
          ))}
        </dl>
      )}
      <p className="mt-4 text-xs text-gray-500 dark:text-gray-400">
        Metadata display is read-only. Preserve metadata in outputs using the option below (JPEG only).
      </p>
    </div>
  );
};
