import { RevealedDataState } from '../hooks/useStegoSession';
import { SerializedHeaderInfo } from '../types/stego';

export interface DownloadPayload {
  bytes: Uint8Array;
  filename: string;
  mimeType: string;
}

export interface FilePreviewInfo {
  filename: string;
  mimeType: string;
  sizeBytes: number;
  sizeLabel: string;
  isTextPreview: boolean;
  previewText: string;
}

/** Formats a byte length into a concise human-readable label. */
export function formatPayloadSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function isTextLikeFile(mimeType: string, filename: string): boolean {
  const lowerMime = mimeType.toLowerCase();
  if (
    lowerMime.startsWith('text/') ||
    lowerMime === 'application/json' ||
    lowerMime === 'application/xml'
  ) {
    return true;
  }
  return /\.(txt|md|json|csv|xml|log|yaml|yml)$/i.test(filename);
}

/** Builds clean metadata and safe preview text for revealed file payloads. */
export function getFilePreviewInfo(
  data: Pick<RevealedDataState, 'filename' | 'mimeType' | 'fileBytes'>
): FilePreviewInfo {
  const filename = data.filename || 'extracted_file.bin';
  const mimeType = data.mimeType || 'application/octet-stream';
  const sizeBytes = data.fileBytes.length;
  const sizeLabel = `${sizeBytes.toLocaleString()} B (${formatPayloadSize(sizeBytes)})`;

  if (sizeBytes > 0 && isTextLikeFile(mimeType, filename)) {
    try {
      const decoded = new TextDecoder('utf-8', { fatal: true }).decode(data.fileBytes);
      if (!decoded.includes('\u0000')) {
        const maxPreviewChars = 2000;
        const previewText =
          decoded.length > maxPreviewChars
            ? `${decoded.slice(0, maxPreviewChars)}\n... [truncated, download file for full content]`
            : decoded;
        return { filename, mimeType, sizeBytes, sizeLabel, isTextPreview: true, previewText };
      }
    } catch {
      // Non-UTF-8 content falls back to binary metadata summary
    }
  }

  const headHex = Array.from(data.fileBytes.slice(0, 16))
    .map((b) => b.toString(16).padStart(2, '0').toUpperCase())
    .join(' ');

  const lines = [
    '[Binary File Payload Extracted]',
    `File Name: ${filename}`,
    `MIME Type: ${mimeType}`,
    `Original Size: ${sizeLabel}`,
  ];
  if (headHex) {
    lines.push(`Header Hex: ${headHex}${sizeBytes > 16 ? ' ...' : ''}`);
  }
  lines.push('', 'Click "Download File" above to save the reconstructed binary file.');

  return {
    filename,
    mimeType,
    sizeBytes,
    sizeLabel,
    isTextPreview: false,
    previewText: lines.join('\n'),
  };
}

/** Converts decoded payload bytes and packet header into RevealedDataState. */
export function createRevealedDataState(
  rawBytes: Uint8Array,
  header: SerializedHeaderInfo
): RevealedDataState {
  const timestamp = header.metadata.timestamp || Date.now();
  if (header.isFile) {
    const filename =
      header.metadata.filename || (header.encrypted ? 'decrypted_file.bin' : 'extracted_file.bin');
    const mimeType = header.metadata.mimeType || 'application/octet-stream';
    const preview = getFilePreviewInfo({ filename, mimeType, fileBytes: rawBytes });
    return {
      mode: 'file',
      text: preview.previewText,
      fileBytes: rawBytes,
      filename,
      mimeType,
      encrypted: header.encrypted,
      payloadLength: rawBytes.length,
      timestamp,
    };
  }

  const text = new TextDecoder('utf-8').decode(rawBytes);
  return {
    mode: 'text',
    text,
    fileBytes: rawBytes,
    filename: header.metadata.filename || 'revealed-message.txt',
    mimeType: header.metadata.mimeType || 'text/plain;charset=utf-8',
    encrypted: header.encrypted,
    payloadLength: rawBytes.length,
    timestamp,
  };
}

/** Builds download bytes and metadata; text mode encodes data.text via TextEncoder. */
export function buildDownloadPayload(data: RevealedDataState): DownloadPayload {
  if (data.mode === 'text') {
    return {
      bytes: new TextEncoder().encode(data.text),
      filename: data.filename || 'revealed-message.txt',
      mimeType: data.mimeType || 'text/plain;charset=utf-8',
    };
  }

  return {
    bytes: data.fileBytes,
    filename: data.filename || 'extracted_file.bin',
    mimeType: data.mimeType || 'application/octet-stream',
  };
}