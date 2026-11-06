export const SUPPORTED_MIME_TYPES = [
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/bmp',
  'image/webp',
];

export const MAX_FILE_SIZE_BYTES = 35 * 1024 * 1024; // 35 MB

export function validateImageFile(file: File): { valid: boolean; error?: string; isLossyInput?: boolean } {
  if (!file) {
    return { valid: false, error: 'No image file provided.' };
  }
  const ext = file.name.split('.').pop()?.toLowerCase() || '';
  const validExt = ['png', 'jpg', 'jpeg', 'bmp', 'webp'].includes(ext);
  if (!SUPPORTED_MIME_TYPES.includes(file.type) && !validExt) {
    return {
      valid: false,
      error: `Unsupported file format (${file.type || ext || 'unknown'}). Please upload a PNG, JPG, JPEG, BMP, or WEBP image.`,
    };
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: `File is too large (${(file.size / (1024 * 1024)).toFixed(1)} MB). Maximum supported file size is 35 MB.`,
    };
  }
  const isLossyInput = file.type === 'image/jpeg' || file.type === 'image/jpg' || ext === 'jpg' || ext === 'jpeg';
  return { valid: true, isLossyInput };
}
