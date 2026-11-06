import { describe, it, expect } from 'vitest';
import { computeCRC32 } from '../utils/crc32';
import { serializeStegoPacket } from '../engine/payloadSerializer';
import { parseStegoHeaderFromBytes } from '../engine/payloadParser';
import { embedPacketIntoPixels } from '../engine/stegoEncoder';
import { extractBytesFromPixels } from '../engine/stegoDecoder';
import { encryptPayload, decryptPayload, evaluatePasswordStrength } from '../engine/cryptoEngine';
import { calculateImageCapacity } from '../engine/capacityCalculator';
import { computeImageQualityMetrics } from '../engine/imageProcessor';

describe('STEGOSHARE Complete Verification Suite', () => {
  it('1. computes CRC32 IEEE 802.3 standard test vector', () => {
    const data = new TextEncoder().encode('123456789');
    expect(computeCRC32(data)).toBe(0xCBF43926);
  });

  it('2. embeds and extracts 1-LSB plaintext correctly', () => {
    const W = 64, H = 64;
    const pixels = new Uint8ClampedArray(W * H * 4);
    for (let i = 0; i < pixels.length; i += 4) {
      pixels[i] = 120;
      pixels[i + 1] = 140;
      pixels[i + 2] = 160;
      pixels[i + 3] = 255;
    }
    const msg = 'Confidential StegoShare Test Payload 2026';
    const packet = serializeStegoPacket({
      payloadBytes: new TextEncoder().encode(msg),
      encrypted: false,
      isFile: false,
      metadata: { mode: 'text', timestamp: Date.now(), originalSize: msg.length },
    });
    const encoded = embedPacketIntoPixels(pixels, packet);
    const maxBytes = Math.floor((Math.floor(encoded.length / 4) * 3) / 8);
    const decoded = parseStegoHeaderFromBytes((cnt) => extractBytesFromPixels(encoded, cnt), maxBytes);
    expect(new TextDecoder().decode(decoded.payload)).toBe(msg);
  });

  it('3. strictly preserves the Alpha channel during 1-LSB embedding', () => {
    const W = 32, H = 32;
    const pixels = new Uint8ClampedArray(W * H * 4);
    for (let i = 0; i < pixels.length; i += 4) {
      pixels[i] = 50;
      pixels[i + 1] = 60;
      pixels[i + 2] = 70;
      pixels[i + 3] = 200; // custom alpha
    }
    const msg = 'Alpha Integrity Check';
    const packet = serializeStegoPacket({
      payloadBytes: new TextEncoder().encode(msg),
      encrypted: false,
      isFile: false,
      metadata: { mode: 'text', timestamp: Date.now(), originalSize: msg.length },
    });
    const encoded = embedPacketIntoPixels(pixels, packet);
    for (let i = 0; i < encoded.length; i += 4) {
      expect(encoded[i + 3]).toBe(200);
    }
  });

  it('4. encrypts and decrypts payloads via AES-256-GCM + PBKDF2', async () => {
    const secretMessage = 'Top-Secret Cryptographic Payload';
    const password = 'SuperSecurePassword2026!#$';
    const rawBytes = new TextEncoder().encode(secretMessage);

    const bundle = await encryptPayload(rawBytes, password);
    expect(bundle.ciphertext.length).toBeGreaterThan(0);
    expect(bundle.salt.length).toBe(16);
    expect(bundle.nonce.length).toBe(12);

    const decrypted = await decryptPayload(bundle.ciphertext, password, bundle.salt, bundle.nonce);
    expect(new TextDecoder().decode(decrypted)).toBe(secretMessage);
  });

  it('5. rejects AES-256-GCM decryption when given an invalid password', async () => {
    const secretMessage = 'Sensitive Intelligence';
    const correctPassword = 'CorrectPassword999!';
    const wrongPassword = 'WrongPassword000?';
    const rawBytes = new TextEncoder().encode(secretMessage);

    const bundle = await encryptPayload(rawBytes, correctPassword);
    await expect(
      decryptPayload(bundle.ciphertext, wrongPassword, bundle.salt, bundle.nonce)
    ).rejects.toThrow();
  });

  it('6. detects tampered payload via CRC32 integrity check', () => {
    const msg = 'Tamper Detection Message';
    const packet = serializeStegoPacket({
      payloadBytes: new TextEncoder().encode(msg),
      encrypted: false,
      isFile: false,
      metadata: { mode: 'text', timestamp: Date.now(), originalSize: msg.length },
    });

    // Corrupt one byte in payload (at the end of the packet)
    packet[packet.length - 1] ^= 0xFF;

    const readFn = (cnt: number) => packet.slice(0, cnt);
    expect(() => parseStegoHeaderFromBytes(readFn, packet.length)).toThrow(/tampered|corrupted|CRC32/i);
  });

  it('7. serializes and decodes arbitrary binary file payloads', () => {
    const fakeFileBytes = new Uint8Array([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x01, 0x02]);
    const packet = serializeStegoPacket({
      payloadBytes: fakeFileBytes,
      encrypted: false,
      isFile: true,
      metadata: {
        mode: 'file',
        filename: 'secret_document.png',
        mimeType: 'image/png',
        timestamp: Date.now(),
        originalSize: fakeFileBytes.length,
      },
    });

    const readFn = (cnt: number) => packet.slice(0, cnt);
    const result = parseStegoHeaderFromBytes(readFn, packet.length);
    expect(result.header.metadata.mode).toBe('file');
    expect(result.header.metadata.filename).toBe('secret_document.png');
    expect(result.header.metadata.mimeType).toBe('image/png');
    expect(result.payload).toEqual(fakeFileBytes);
  });

  it('8. calculates carrier capacity accurately and warns on overflow', () => {
    const W = 100, H = 100; // 10,000 pixels = 30,000 available bits = 3,750 available bytes
    const smallReport = calculateImageCapacity(W, H, 100, false);
    expect(smallReport.totalAvailableBytes).toBe(3750);
    expect(smallReport.exceedsCapacity).toBe(false);
    expect(smallReport.capacityPercentage).toBeLessThan(10);

    // Overflow payload of 4,000 bytes
    const largeReport = calculateImageCapacity(W, H, 4000, false);
    expect(largeReport.exceedsCapacity).toBe(true);
  });

  it('9. evaluates password strength and entropy correctly', () => {
    const weak = evaluatePasswordStrength('12345');
    expect(weak.score).toBeLessThanOrEqual(1);

    const strong = evaluatePasswordStrength('K8#mZ$9v!Lq2@xP7');
    expect(strong.score).toBeGreaterThanOrEqual(3);
    expect(strong.entropyBits).toBeGreaterThan(60);
  });

  it('10. calculates PSNR and SSIM quality metrics showing imperceptible deviation', () => {
    const W = 40, H = 40;
    const orig = new Uint8ClampedArray(W * H * 4);
    orig.fill(128);

    const msg = 'Metrics check';
    const packet = serializeStegoPacket({
      payloadBytes: new TextEncoder().encode(msg),
      encrypted: false,
      isFile: false,
      metadata: { mode: 'text', timestamp: Date.now(), originalSize: msg.length },
    });
    const encoded = embedPacketIntoPixels(orig, packet);
    const metrics = computeImageQualityMetrics(orig, encoded);

    expect(metrics.psnr).toBeGreaterThan(50); // PSNR > 50 dB is virtually indistinguishable
    expect(metrics.ssim).toBeGreaterThan(0.999);
    expect(metrics.modifiedPixels).toBeGreaterThan(0);
  });
});
