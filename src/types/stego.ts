export type PayloadMode = 'text' | 'file';

export interface StegoMetadata {
  mode: PayloadMode;
  filename?: string;
  mimeType?: string;
  timestamp: number;
  originalSize: number;
}

export interface SerializedHeaderInfo {
  magicValid: boolean;
  version: number;
  encrypted: boolean;
  isFile: boolean;
  salt: Uint8Array;
  nonce: Uint8Array;
  metadata: StegoMetadata;
  payloadLength: number;
  crc32: number;
  headerByteLength: number;
  totalByteLength: number;
}

export interface CapacityReport {
  width: number;
  height: number;
  totalPixels: number;
  totalAvailableBits: number;
  totalAvailableBytes: number;
  headerOverheadBytes: number;
  maxPayloadBytes: number;
  usedPayloadBytes: number;
  totalUsedBytes: number;
  remainingBytes: number;
  capacityPercentage: number;
  exceedsCapacity: boolean;
}

export interface ImageQualityMetrics {
  psnr: number;
  mse: number;
  ssim: number;
  modifiedPixels: number;
  modifiedChannels: number;
  totalPixels: number;
}
