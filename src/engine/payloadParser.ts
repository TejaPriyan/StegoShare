import { SerializedHeaderInfo, StegoMetadata } from '../types/stego';
import { MAGIC_SIGNATURE, FORMAT_VERSION } from './payloadSerializer';
import { computeCRC32 } from '../utils/crc32';

export function parseStegoHeaderFromBytes(
  readBytesFn: (byteCount: number) => Uint8Array,
  maxCarrierBytes: number
): { header: SerializedHeaderInfo; payload: Uint8Array } {
  const decoder = new TextDecoder();
  if (maxCarrierBytes < 24) {
    throw new Error('No hidden STEGOSHARE message was detected in this image.');
  }

  const prefix = readBytesFn(13);
  const magic = decoder.decode(prefix.slice(0, 10));
  if (magic !== MAGIC_SIGNATURE) {
    throw new Error('No hidden STEGOSHARE message was detected in this image.');
  }

  const version = prefix[10];
  if (version !== FORMAT_VERSION) {
    throw new Error(`Unsupported payload version (v${version}). Expected v${FORMAT_VERSION}.`);
  }

  const flags = prefix[11];
  const encrypted = (flags & 0x01) !== 0;
  const isFile = (flags & 0x02) !== 0;
  const saltLen = prefix[12];

  if (saltLen > 64) {
    throw new Error('Corrupted payload header: invalid salt length.');
  }

  const step2Len = 13 + saltLen + 1;
  const buf2 = readBytesFn(step2Len);
  const salt = buf2.slice(13, 13 + saltLen);
  const nonceLen = buf2[13 + saltLen];

  if (nonceLen > 64) {
    throw new Error('Corrupted payload header: invalid nonce length.');
  }

  const step3Len = step2Len + nonceLen + 2;
  const buf3 = readBytesFn(step3Len);
  const nonce = buf3.slice(step2Len, step2Len + nonceLen);
  const view3 = new DataView(buf3.buffer, buf3.byteOffset, buf3.byteLength);
  const metaLen = view3.getUint16(step2Len + nonceLen, false);

  if (metaLen > 4096) {
    throw new Error('Corrupted payload header: invalid metadata block.');
  }

  const headerByteLength = step3Len + metaLen + 8;
  if (headerByteLength > maxCarrierBytes) {
    throw new Error('Corrupted payload: header exceeds carrier image capacity.');
  }

  const fullHeaderBuf = readBytesFn(headerByteLength);
  const metaBytes = fullHeaderBuf.slice(step3Len, step3Len + metaLen);
  let metadata: StegoMetadata = { mode: isFile ? 'file' : 'text', timestamp: Date.now(), originalSize: 0 };
  try {
    metadata = JSON.parse(decoder.decode(metaBytes));
  } catch {
    throw new Error('Corrupted payload metadata.');
  }

  const viewHeader = new DataView(fullHeaderBuf.buffer, fullHeaderBuf.byteOffset, fullHeaderBuf.byteLength);
  const payloadLength = viewHeader.getUint32(step3Len + metaLen, false);
  const expectedCrc = viewHeader.getUint32(step3Len + metaLen + 4, false);

  const totalByteLength = headerByteLength + payloadLength;
  if (payloadLength === 0 || totalByteLength > maxCarrierBytes) {
    throw new Error('Corrupted or truncated payload: declared payload length exceeds image size.');
  }

  const fullPacket = readBytesFn(totalByteLength);
  const payload = fullPacket.slice(headerByteLength, totalByteLength);
  const actualCrc = computeCRC32(payload);

  if (actualCrc !== expectedCrc) {
    throw new Error('Corrupted payload: CRC32 integrity verification failed. Image pixels may have been altered or compressed.');
  }

  return {
    header: {
      magicValid: true,
      version,
      encrypted,
      isFile,
      salt,
      nonce,
      metadata,
      payloadLength,
      crc32: expectedCrc,
      headerByteLength,
      totalByteLength,
    },
    payload,
  };
}
