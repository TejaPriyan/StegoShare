import { StegoMetadata } from '../types/stego';
import { computeCRC32 } from '../utils/crc32';

export const MAGIC_SIGNATURE = 'STEGOSHARE';
export const FORMAT_VERSION = 1;

export interface SerializeInput {
  payloadBytes: Uint8Array;
  encrypted: boolean;
  isFile: boolean;
  salt?: Uint8Array;
  nonce?: Uint8Array;
  metadata: StegoMetadata;
}

export function serializeStegoPacket(input: SerializeInput): Uint8Array {
  const encoder = new TextEncoder();
  const magicBytes = encoder.encode(MAGIC_SIGNATURE); // 10 bytes
  const metaBytes = encoder.encode(JSON.stringify(input.metadata));
  const saltBytes = input.encrypted && input.salt ? input.salt : new Uint8Array(0);
  const nonceBytes = input.encrypted && input.nonce ? input.nonce : new Uint8Array(0);

  const flags = (input.encrypted ? 0x01 : 0x00) | (input.isFile ? 0x02 : 0x00);
  const crc = computeCRC32(input.payloadBytes);

  const headerLength =
    10 + // MAGIC
    1 +  // VERSION
    1 +  // FLAGS
    1 +  // SALT LEN
    saltBytes.length +
    1 +  // NONCE LEN
    nonceBytes.length +
    2 +  // META LEN (Uint16 BE)
    metaBytes.length +
    4 +  // PAYLOAD LEN (Uint32 BE)
    4;   // CRC32 (Uint32 BE)

  const totalLength = headerLength + input.payloadBytes.length;
  const packet = new Uint8Array(totalLength);
  const view = new DataView(packet.buffer);

  let offset = 0;
  packet.set(magicBytes, offset);
  offset += 10;

  packet[offset++] = FORMAT_VERSION;
  packet[offset++] = flags;

  packet[offset++] = saltBytes.length;
  if (saltBytes.length > 0) {
    packet.set(saltBytes, offset);
    offset += saltBytes.length;
  }

  packet[offset++] = nonceBytes.length;
  if (nonceBytes.length > 0) {
    packet.set(nonceBytes, offset);
    offset += nonceBytes.length;
  }

  view.setUint16(offset, metaBytes.length, false);
  offset += 2;
  packet.set(metaBytes, offset);
  offset += metaBytes.length;

  view.setUint32(offset, input.payloadBytes.length, false);
  offset += 4;

  view.setUint32(offset, crc, false);
  offset += 4;

  packet.set(input.payloadBytes, offset);
  return packet;
}
