import { parseStegoHeaderFromBytes } from './payloadParser';
import { SerializedHeaderInfo } from '../types/stego';

export function extractBytesFromPixels(
  pixels: Uint8ClampedArray,
  byteCount: number
): Uint8Array {
  const totalBitsNeeded = byteCount * 8;
  const maxBits = Math.floor(pixels.length / 4) * 3;
  if (totalBitsNeeded > maxBits) {
    throw new Error('Requested byte extraction exceeds carrier image pixel count.');
  }

  const result = new Uint8Array(byteCount);
  let bitIndex = 0;

  for (let i = 0; i < pixels.length && bitIndex < totalBitsNeeded; i += 4) {
    for (let c = 0; c < 3 && bitIndex < totalBitsNeeded; c++) {
      const bit = pixels[i + c] & 1;
      const bytePos = bitIndex >>> 3;
      const bitShift = 7 - (bitIndex & 7);
      result[bytePos] |= bit << bitShift;
      bitIndex++;
    }
  }

  return result;
}

export function decodeStegoPixels(pixels: Uint8ClampedArray): {
  header: SerializedHeaderInfo;
  payload: Uint8Array;
} {
  const maxCarrierBytes = Math.floor((Math.floor(pixels.length / 4) * 3) / 8);
  return parseStegoHeaderFromBytes(
    (count) => extractBytesFromPixels(pixels, count),
    maxCarrierBytes
  );
}
