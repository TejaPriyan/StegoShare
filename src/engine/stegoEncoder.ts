/**
 * STEGOSHARE LSB Encoder
 * Embeds a serialized Uint8Array packet into the Least Significant Bits (LSB)
 * of the R, G, and B channels while keeping the Alpha channel unchanged.
 */

export function embedPacketIntoPixels(
  sourcePixels: Uint8ClampedArray,
  packet: Uint8Array
): Uint8ClampedArray {
  const totalBits = packet.length * 8;
  const totalPixels = Math.floor(sourcePixels.length / 4);
  const maxAvailableBits = totalPixels * 3;

  if (totalBits > maxAvailableBits) {
    throw new Error(
      'Message too large for this image. Please upload a higher-resolution image or use a shorter message.'
    );
  }

  const output = new Uint8ClampedArray(sourcePixels);
  let bitIndex = 0;

  for (let i = 0; i < output.length && bitIndex < totalBits; i += 4) {
    // Embed in Red, Green, Blue channels (skip i + 3 which is Alpha)
    for (let c = 0; c < 3 && bitIndex < totalBits; c++) {
      const bytePos = bitIndex >>> 3;
      const bitShift = 7 - (bitIndex & 7);
      const bit = (packet[bytePos] >>> bitShift) & 1;
      output[i + c] = (output[i + c] & 0xFE) | bit;
      bitIndex++;
    }
  }

  return output;
}
