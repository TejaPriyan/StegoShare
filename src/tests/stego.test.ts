import { describe, it, expect, vi } from 'vitest';
import { computeCRC32 } from '../utils/crc32';
import { serializeStegoPacket } from '../engine/payloadSerializer';
import { parseStegoHeaderFromBytes } from '../engine/payloadParser';
import { embedPacketIntoPixels } from '../engine/stegoEncoder';
import { extractBytesFromPixels } from '../engine/stegoDecoder';
import { encryptPayload, decryptPayload, evaluatePasswordStrength, PureCrypto } from '../engine/cryptoEngine';
import { calculateImageCapacity } from '../engine/capacityCalculator';
import { computeImageQualityMetrics } from '../engine/imageProcessor';
import { createRevealedDataState, buildDownloadPayload, getFilePreviewInfo } from '../utils/decodeHelpers';

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

  it('11. fails closed in encryptPayload when crypto.getRandomValues is unavailable', async () => {
    const rawBytes = new TextEncoder().encode('Fail closed entropy check');
    try {
      vi.stubGlobal('crypto', undefined);
      await expect(encryptPayload(rawBytes, 'StrongPass!1')).rejects.toThrow(/getRandomValues|random/i);

      vi.stubGlobal('crypto', {});
      await expect(encryptPayload(rawBytes, 'StrongPass!1')).rejects.toThrow(/getRandomValues|random/i);
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it('12. enforces 12-byte AES-GCM nonce in PureCrypto, decryptPayload, and header parser', async () => {
    const key = new Uint8Array(32).fill(7);
    const validNonce = new Uint8Array(12).fill(3);
    const plain = new TextEncoder().encode('Nonce validation payload');
    const encrypted = PureCrypto.encryptGCM(key, validNonce, plain);
    expect(PureCrypto.decryptGCM(key, validNonce, encrypted)).toEqual(plain);

    for (const badLen of [0, 8, 16, 20]) {
      const badNonce = new Uint8Array(badLen).fill(1);
      expect(() => PureCrypto.encryptGCM(key, badNonce, plain)).toThrow(/nonce length/i);
      expect(() => PureCrypto.decryptGCM(key, badNonce, encrypted)).toThrow(/nonce length/i);
      await expect(
        decryptPayload(encrypted, 'password', new Uint8Array(16).fill(2), badNonce)
      ).rejects.toThrow(/nonce length/i);
    }

    // Encrypted packet with corrupted nonce length (20 bytes) in binary header must be rejected
    const fakeEncryptedPacket = serializeStegoPacket({
      payloadBytes: encrypted,
      encrypted: true,
      isFile: false,
      salt: new Uint8Array(16).fill(4),
      nonce: new Uint8Array(20).fill(5),
      metadata: { mode: 'text', timestamp: Date.now(), originalSize: plain.length },
    });
    expect(() =>
      parseStegoHeaderFromBytes((cnt) => fakeEncryptedPacket.slice(0, cnt), fakeEncryptedPacket.length)
    ).toThrow(/invalid nonce length/i);
  });

  it('13. exercises PureCrypto PBKDF2/GCM decryption fallback when crypto.subtle is absent', async () => {
    const msg = 'Fallback Path Verification';
    const pass = 'FallbackSecret#2026';
    const bundle = await encryptPayload(new TextEncoder().encode(msg), pass);

    const getRandomValues = globalThis.crypto.getRandomValues.bind(globalThis.crypto);
    try {
      vi.stubGlobal('crypto', { getRandomValues });
      const decrypted = await decryptPayload(bundle.ciphertext, pass, bundle.salt, bundle.nonce);
      expect(new TextDecoder().decode(decrypted)).toBe(msg);
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it('13b. fails closed when crypto.getRandomValues is unavailable', async () => {
    try {
      vi.stubGlobal('crypto', undefined);
      await expect(
        encryptPayload(new TextEncoder().encode('secret'), 'StrongPass#2026')
      ).rejects.toThrow(/crypto\.getRandomValues/i);
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it('14. encodes text-mode downloads via TextEncoder and formats file-mode metadata/previews', () => {
    const unicodeText = 'Zero-Knowledge Secret 🔐 UTF-8 ✓';
    const textBytes = new TextEncoder().encode(unicodeText);
    const textPacket = serializeStegoPacket({
      payloadBytes: textBytes,
      encrypted: false,
      isFile: false,
      metadata: { mode: 'text', timestamp: 1700000000000, originalSize: textBytes.length },
    });
    const decodedText = parseStegoHeaderFromBytes((c) => textPacket.slice(0, c), textPacket.length);
    const textState = createRevealedDataState(decodedText.payload, decodedText.header);

    expect(textState.mode).toBe('text');
    expect(textState.text).toBe(unicodeText);
    expect(textState.fileBytes).toEqual(textBytes);

    // Even if a caller passes empty fileBytes in text mode, download must encode data.text (never 0 bytes)
    const downloadFromEmptyBytes = buildDownloadPayload({
      ...textState,
      fileBytes: new Uint8Array(0),
    });
    expect(downloadFromEmptyBytes.bytes).toEqual(textBytes);
    expect(downloadFromEmptyBytes.bytes.length).toBeGreaterThan(0);
    expect(downloadFromEmptyBytes.filename).toBe('revealed-message.txt');

    // Binary file mode metadata & preview
    const binBytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    const binPacket = serializeStegoPacket({
      payloadBytes: binBytes,
      encrypted: true,
      isFile: true,
      salt: new Uint8Array(16).fill(1),
      nonce: new Uint8Array(12).fill(2),
      metadata: {
        mode: 'file',
        filename: 'vault.png',
        mimeType: 'image/png',
        timestamp: 1700000000000,
        originalSize: binBytes.length,
      },
    });
    const decodedBin = parseStegoHeaderFromBytes((c) => binPacket.slice(0, c), binPacket.length);
    const binState = createRevealedDataState(decodedBin.payload, decodedBin.header);
    const binDownload = buildDownloadPayload(binState);
    const binPreview = getFilePreviewInfo(binState);

    expect(binDownload.bytes).toEqual(binBytes);
    expect(binDownload.filename).toBe('vault.png');
    expect(binDownload.mimeType).toBe('image/png');
    expect(binPreview.isTextPreview).toBe(false);
    expect(binPreview.previewText).toContain('vault.png');
    expect(binPreview.previewText).toContain('image/png');

    // Text-like file mode preview
    const jsonBytes = new TextEncoder().encode('{"ok":true}');
    const jsonPreview = getFilePreviewInfo({
      filename: 'config.json',
      mimeType: 'application/json',
      fileBytes: jsonBytes,
    });
    expect(jsonPreview.isTextPreview).toBe(true);
    expect(jsonPreview.previewText).toBe('{"ok":true}');
  });
});
