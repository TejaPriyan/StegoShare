import { CapacityReport } from '../types/stego';
import { GCM_TAG_BYTE_LENGTH, SALT_LENGTH, NONCE_LENGTH } from './cryptoEngine';

export function calculateImageCapacity(
  width: number,
  height: number,
  rawPayloadByteLength: number,
  encrypted: boolean,
  metadataByteLength = 68
): CapacityReport {
  const totalPixels = Math.max(0, width * height);
  const totalAvailableBits = totalPixels * 3; // 3 RGB channels, 1 bit per channel
  const totalAvailableBytes = Math.floor(totalAvailableBits / 8);

  const saltBytes = encrypted ? SALT_LENGTH : 0;
  const nonceBytes = encrypted ? NONCE_LENGTH : 0;
  const gcmTagBytes = encrypted ? GCM_TAG_BYTE_LENGTH : 0;

  const headerOverheadBytes = 10 + 1 + 1 + 1 + saltBytes + 1 + nonceBytes + 2 + metadataByteLength + 4 + 4;
  const usedPayloadBytes = rawPayloadByteLength > 0 ? rawPayloadByteLength + gcmTagBytes : 0;
  const totalUsedBytes = rawPayloadByteLength > 0 ? headerOverheadBytes + usedPayloadBytes : 0;
  const maxPayloadBytes = Math.max(0, totalAvailableBytes - headerOverheadBytes - gcmTagBytes);
  const remainingBytes = Math.max(0, totalAvailableBytes - totalUsedBytes);
  const capacityPercentage = totalAvailableBytes > 0
    ? Math.min(100, Number(((totalUsedBytes / totalAvailableBytes) * 100).toFixed(2)))
    : 0;

  return {
    width,
    height,
    totalPixels,
    totalAvailableBits,
    totalAvailableBytes,
    headerOverheadBytes,
    maxPayloadBytes,
    usedPayloadBytes,
    totalUsedBytes,
    remainingBytes,
    capacityPercentage,
    exceedsCapacity: totalUsedBytes > totalAvailableBytes,
  };
}
