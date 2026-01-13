// API client for tracking conversions - Image Tools
import { getAuthToken } from './sharedAuth';

const API_BASE_URL = 'https://api.tools.fawadhs.dev';

export interface ConversionLogData {
  action: 'convert' | 'resize' | 'compress' | 'crop' | 'rotate';
  fileCount?: number;
  inputFormat?: string;
  outputFormat?: string;
  inputSize?: number;
  outputSize?: number;
  processingTime?: number;
}

export async function logConversion(data: ConversionLogData): Promise<void> {
  const token = getAuthToken();
  
  // Only log if user is authenticated
  if (!token) return;

  try {
    await fetch(`${API_BASE_URL}/api/usage/log-conversion`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
  } catch (error) {
    // Silently fail - don't disrupt user experience
    console.warn('Failed to log conversion:', error);
  }
}
