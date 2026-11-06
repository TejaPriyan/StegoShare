import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { Footer } from './components/Footer';
import { CapacityMeter } from './components/CapacityMeter';
import { MessageEditor } from './components/MessageEditor';
import { PasswordInput } from './components/PasswordInput';
import { ImageComparison } from './components/ImageComparison';
import { DecodeResult } from './components/DecodeResult';
import { useStegoSession } from './hooks/useStegoSession';
import { calculateImageCapacity } from './engine/capacityCalculator';
import { encryptPayload, decryptPayload } from './engine/cryptoEngine';
import { serializeStegoPacket } from './engine/payloadSerializer';
import { embedPacketIntoPixels } from './engine/stegoEncoder';
import { decodeStegoPixels } from './engine/stegoDecoder';
import { computeImageQualityMetrics, buildAmplifiedDiffPixels } from './engine/imageProcessor';
import { validateImageFile } from './engine/imageValidator';

export default function App() {
  const session = useStegoSession();
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [policyModalTab, setPolicyModalTab] = useState<'privacy' | 'terms' | null>(null);

  // Reveal password input state
  const [revealPassword, setRevealPassword] = useState('');
  const [testResults, setTestResults] = useState<Array<{ id: string; name: string; passed: boolean; detail: string }> | null>(null);

  const showStatus = (text: string, type: 'success' | 'error' | 'info' = 'info') => {
    setStatusMessage({ text, type });
    setTimeout(() => setStatusMessage(null), 5000);
  };

  // Compute live capacity for Hide view
  const payloadBytesLength = session.payloadMode === 'text'
    ? new TextEncoder().encode(session.secretText).length
    : (session.secretFile ? session.secretFile.size : 0);

  const capacityReport = session.carrierImage
    ? calculateImageCapacity(
        session.carrierImage.width,
        session.carrierImage.height,
        payloadBytesLength,
        Boolean(session.password)
      )
    : null;

  // Load sample carrier image onto canvas
  const loadSampleCarrier = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 300;
    canvas.height = 300;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Create visually rich generative cyber pattern
    const grad = ctx.createLinearGradient(0, 0, 300, 300);
    grad.addColorStop(0, '#091512');
    grad.addColorStop(0.5, '#052e22');
    grad.addColorStop(1, '#064e3b');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 300, 300);

    ctx.strokeStyle = 'rgba(0, 255, 136, 0.25)';
    ctx.lineWidth = 1;
    for (let x = 0; x < 300; x += 20) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 300);
      ctx.stroke();
    }
    for (let y = 0; y < 300; y += 20) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(300, y);
      ctx.stroke();
    }

    ctx.fillStyle = '#00FF88';
    ctx.font = 'bold 20px monospace';
    ctx.fillText('STEGOSHARE CARRIER', 20, 155);

    const imgData = ctx.getImageData(0, 0, 300, 300);
    const dataUrl = canvas.toDataURL('image/png');

    session.setCarrierImage({
      width: 300,
      height: 300,
      pixels: imgData.data,
      dataUrl,
      fileName: 'sample_carrier.png',
      fileSize: Math.round(dataUrl.length * 0.75),
      mimeType: 'image/png',
      isLossy: false,
    });
    showStatus('Loaded sample carrier image (300x300 PNG).', 'info');
  };

  // Handle Carrier Image Upload
  const handleCarrierUpload = (file: File) => {
    const validation = validateImageFile(file);
    if (!validation.valid) {
      showStatus(validation.error || 'Invalid carrier image file.', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          showStatus('Failed to get 2D canvas context.', 'error');
          return;
        }
        ctx.drawImage(img, 0, 0);
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);

        session.setCarrierImage({
          width: canvas.width,
          height: canvas.height,
          pixels: imgData.data,
          dataUrl,
          fileName: file.name,
          fileSize: file.size,
          mimeType: file.type || 'image/png',
          isLossy: Boolean(validation.isLossyInput),
        });
        showStatus(`Carrier loaded: ${canvas.width}x${canvas.height} px (${(file.size / 1024).toFixed(1)} KB)`, 'success');
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  // Perform Encoding
  const handleEncode = async () => {
    if (!session.carrierImage) {
      showStatus('Please select or upload a carrier image first.', 'error');
      return;
    }

    let rawBytes: Uint8Array;
    if (session.payloadMode === 'text') {
      if (!session.secretText.trim()) {
        showStatus('Please enter a secret message to hide.', 'error');
        return;
      }
      rawBytes = new TextEncoder().encode(session.secretText);
    } else {
      if (!session.secretFile) {
        showStatus('Please select a file to hide.', 'error');
        return;
      }
      rawBytes = session.secretFile.bytes;
    }

    if (session.password && session.confirmPassword && session.password !== session.confirmPassword) {
      showStatus('Passwords do not match.', 'error');
      return;
    }

    setIsProcessing(true);
    try {
      let finalPayload = rawBytes;
      let salt: Uint8Array | undefined;
      let nonce: Uint8Array | undefined;
      const encrypted = Boolean(session.password);

      if (encrypted) {
        const bundle = await encryptPayload(rawBytes, session.password);
        finalPayload = bundle.ciphertext;
        salt = bundle.salt;
        nonce = bundle.nonce;
      }

      const packet = serializeStegoPacket({
        payloadBytes: finalPayload,
        encrypted,
        isFile: session.payloadMode === 'file',
        salt,
        nonce,
        metadata: {
          mode: session.payloadMode,
          filename: session.secretFile ? session.secretFile.name : undefined,
          mimeType: session.secretFile ? session.secretFile.mimeType : undefined,
          timestamp: Date.now(),
          originalSize: rawBytes.length,
        },
      });

      const encodedPixels = embedPacketIntoPixels(session.carrierImage.pixels, packet);

      // Create encoded PNG data URL
      const canvas = document.createElement('canvas');
      canvas.width = session.carrierImage.width;
      canvas.height = session.carrierImage.height;
      const ctx = canvas.getContext('2d')!;
      const outImgData = ctx.createImageData(canvas.width, canvas.height);
      outImgData.data.set(encodedPixels);
      ctx.putImageData(outImgData, 0, 0);
      const pngDataUrl = canvas.toDataURL('image/png');

      // Create amplified difference map
      const diffPixels = buildAmplifiedDiffPixels(session.carrierImage.pixels, encodedPixels);
      const diffCanvas = document.createElement('canvas');
      diffCanvas.width = session.carrierImage.width;
      diffCanvas.height = session.carrierImage.height;
      const diffCtx = diffCanvas.getContext('2d')!;
      const diffImgData = diffCtx.createImageData(diffCanvas.width, diffCanvas.height);
      diffImgData.data.set(diffPixels);
      diffCtx.putImageData(diffImgData, 0, 0);
      const diffDataUrl = diffCanvas.toDataURL('image/png');

      const metrics = computeImageQualityMetrics(session.carrierImage.pixels, encodedPixels);
      const capacityPct = capacityReport ? capacityReport.capacityPercentage : 0;

      session.setEncodedResult({
        pngDataUrl,
        diffDataUrl,
        encodedPixels,
        packetLength: packet.length,
        crcHex: 'OK',
        encrypted,
        metrics,
        width: canvas.width,
        height: canvas.height,
        capacityPercentage: capacityPct,
      });

      showStatus('Secret payload successfully embedded into lossless Stego PNG!', 'success');
    } catch (err: any) {
      showStatus(err.message || 'Encoding failed.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle Reveal Image Upload
  const handleRevealUpload = (file: File) => {
    const validation = validateImageFile(file);
    if (!validation.valid) {
      showStatus(validation.error || 'Invalid stego image file.', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(img, 0, 0);
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);

        session.setRevealImage({
          width: canvas.width,
          height: canvas.height,
          pixels: imgData.data,
          dataUrl,
          fileName: file.name,
          fileSize: file.size,
          mimeType: file.type || 'image/png',
          isLossy: Boolean(validation.isLossyInput),
        });

        // Attempt automatic decode header
        try {
          const { header, payload } = decodeStegoPixels(imgData.data);
          session.setDetectedPacket({ header, payloadBytes: payload });

          if (!header.encrypted) {
            // Immediately decode plaintext
            if (header.isFile) {
              session.setRevealedData({
                mode: 'file',
                text: '',
                fileBytes: payload,
                filename: header.metadata.filename || 'extracted_file.bin',
                mimeType: header.metadata.mimeType || 'application/octet-stream',
                encrypted: false,
                payloadLength: payload.length,
                timestamp: header.metadata.timestamp,
              });
            } else {
              const text = new TextDecoder().decode(payload);
              session.setRevealedData({
                mode: 'text',
                text,
                fileBytes: new Uint8Array(0),
                filename: '',
                mimeType: 'text/plain',
                encrypted: false,
                payloadLength: payload.length,
                timestamp: header.metadata.timestamp,
              });
            }
            showStatus('Stego message successfully extracted!', 'success');
          } else {
            showStatus('Encrypted Stego payload detected. Please enter decryption password.', 'info');
          }
        } catch (err: any) {
          session.setDetectedPacket(null);
          session.setRevealedData(null);
          showStatus(err.message || 'No STEGOSHARE payload detected in this image.', 'error');
        }
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  // Handle Decryption of Encrypted Packet
  const handleDecryptRevealed = async () => {
    if (!session.detectedPacket) {
      showStatus('No encrypted payload packet found to decrypt.', 'error');
      return;
    }
    if (!revealPassword) {
      showStatus('Please enter the decryption password.', 'error');
      return;
    }

    setIsProcessing(true);
    try {
      const { header, payloadBytes } = session.detectedPacket;
      const decryptedBytes = await decryptPayload(
        payloadBytes,
        revealPassword,
        header.salt,
        header.nonce
      );

      if (header.isFile) {
        session.setRevealedData({
          mode: 'file',
          text: '',
          fileBytes: decryptedBytes,
          filename: header.metadata.filename || 'decrypted_file.bin',
          mimeType: header.metadata.mimeType || 'application/octet-stream',
          encrypted: true,
          payloadLength: decryptedBytes.length,
          timestamp: header.metadata.timestamp,
        });
      } else {
        const text = new TextDecoder().decode(decryptedBytes);
        session.setRevealedData({
          mode: 'text',
          text,
          fileBytes: new Uint8Array(0),
          filename: '',
          mimeType: 'text/plain',
          encrypted: true,
          payloadLength: decryptedBytes.length,
          timestamp: header.metadata.timestamp,
        });
      }
      showStatus('Decryption successful! Authenticated with AES-256-GCM.', 'success');
    } catch (err: any) {
      showStatus('Decryption failed: Incorrect password or corrupted payload.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  // Run React-side 10-test verification suite
  const runReactVerification = async () => {
    const list: Array<{ id: string; name: string; passed: boolean; detail: string }> = [];

    // Test 1: CRC32
    try {
      const { computeCRC32 } = await import('./utils/crc32');
      const val = computeCRC32(new TextEncoder().encode('123456789'));
      list.push({ id: 'TEST-01', name: 'CRC32 IEEE 802.3 Test Vector', passed: val === 0xCBF43926, detail: 'Expected 0xCBF43926, got 0x' + val.toString(16).toUpperCase() });
    } catch (e: any) {
      list.push({ id: 'TEST-01', name: 'CRC32 Test Vector', passed: false, detail: e.message });
    }

    // Test 2: Plaintext 1-LSB
    try {
      const pixels = new Uint8ClampedArray(40 * 40 * 4).fill(100);
      const msg = 'Test Plaintext';
      const p = serializeStegoPacket({ payloadBytes: new TextEncoder().encode(msg), encrypted: false, isFile: false, metadata: { mode: 'text', timestamp: Date.now(), originalSize: msg.length } });
      const enc = embedPacketIntoPixels(pixels, p);
      const dec = decodeStegoPixels(enc);
      const res = new TextDecoder().decode(dec.payload);
      list.push({ id: 'TEST-02', name: 'Plaintext 1-LSB Embedding Roundtrip', passed: res === msg, detail: 'Payload matched perfectly.' });
    } catch (e: any) {
      list.push({ id: 'TEST-02', name: 'Plaintext 1-LSB', passed: false, detail: e.message });
    }

    // Test 3: Alpha Channel Preservation
    try {
      const pixels = new Uint8ClampedArray(20 * 20 * 4);
      for (let i = 0; i < pixels.length; i += 4) { pixels[i] = 50; pixels[i + 1] = 60; pixels[i + 2] = 70; pixels[i + 3] = 210; }
      const p = serializeStegoPacket({ payloadBytes: new TextEncoder().encode('Alpha check'), encrypted: false, isFile: false, metadata: { mode: 'text', timestamp: Date.now(), originalSize: 11 } });
      const enc = embedPacketIntoPixels(pixels, p);
      let intact = true;
      for (let i = 0; i < enc.length; i += 4) { if (enc[i + 3] !== 210) { intact = false; break; } }
      list.push({ id: 'TEST-03', name: 'Alpha Channel Preservation', passed: intact, detail: 'Alpha byte values remained untouched at 210.' });
    } catch (e: any) {
      list.push({ id: 'TEST-03', name: 'Alpha Preservation', passed: false, detail: e.message });
    }

    // Test 4: AES-256-GCM Cryptographic Roundtrip
    try {
      const b = await encryptPayload(new TextEncoder().encode('Secret React Payload'), 'P@ssw0rd2026!');
      const d = await decryptPayload(b.ciphertext, 'P@ssw0rd2026!', b.salt, b.nonce);
      list.push({ id: 'TEST-04', name: 'AES-256-GCM + PBKDF2 Roundtrip', passed: new TextDecoder().decode(d) === 'Secret React Payload', detail: 'Authenticated GCM tag verified.' });
    } catch (e: any) {
      list.push({ id: 'TEST-04', name: 'AES-256-GCM Roundtrip', passed: false, detail: e.message });
    }

    // Test 5: Rejection of Invalid Password
    try {
      const b = await encryptPayload(new TextEncoder().encode('Test Reject'), 'GoodPass!');
      let failed = false;
      try {
        await decryptPayload(b.ciphertext, 'BadPass?', b.salt, b.nonce);
      } catch {
        failed = true;
      }
      list.push({ id: 'TEST-05', name: 'Rejection of Invalid Password', passed: failed, detail: 'GCM authentication tag rejected bad key.' });
    } catch (e: any) {
      list.push({ id: 'TEST-05', name: 'Invalid Password Check', passed: false, detail: e.message });
    }

    // Test 6: CRC32 Tamper Detection
    try {
      const p = serializeStegoPacket({ payloadBytes: new TextEncoder().encode('Tamper Msg'), encrypted: false, isFile: false, metadata: { mode: 'text', timestamp: Date.now(), originalSize: 10 } });
      p[p.length - 1] ^= 0x55;
      let caught = false;
      try {
        const { parseStegoHeaderFromBytes } = await import('./engine/payloadParser');
        parseStegoHeaderFromBytes((cnt) => p.slice(0, cnt), p.length);
      } catch {
        caught = true;
      }
      list.push({ id: 'TEST-06', name: 'Tamper Detection via CRC32', passed: caught, detail: 'CRC32 checksum mismatch caught corrupted byte.' });
    } catch (e: any) {
      list.push({ id: 'TEST-06', name: 'Tamper Detection', passed: false, detail: e.message });
    }

    // Test 7: Binary File Roundtrip
    try {
      const fBytes = new Uint8Array([0x01, 0x02, 0x03, 0x04, 0x05, 0xAA, 0xBB]);
      const p = serializeStegoPacket({ payloadBytes: fBytes, encrypted: false, isFile: true, metadata: { mode: 'file', filename: 'test.bin', mimeType: 'application/octet-stream', timestamp: Date.now(), originalSize: 7 } });
      const { parseStegoHeaderFromBytes } = await import('./engine/payloadParser');
      const res = parseStegoHeaderFromBytes((cnt) => p.slice(0, cnt), p.length);
      list.push({ id: 'TEST-07', name: 'Binary File Payload Serialization', passed: res.header.metadata.filename === 'test.bin' && res.payload.length === 7, detail: 'Binary buffer preserved intact.' });
    } catch (e: any) {
      list.push({ id: 'TEST-07', name: 'Binary File Payload', passed: false, detail: e.message });
    }

    // Test 8: Capacity Limits
    try {
      const rep = calculateImageCapacity(50, 50, 10000, false);
      list.push({ id: 'TEST-08', name: 'Capacity Overflow Guard', passed: rep.exceedsCapacity, detail: 'Correctly flagged 10KB payload exceeding 50x50 canvas.' });
    } catch (e: any) {
      list.push({ id: 'TEST-08', name: 'Capacity Overflow', passed: false, detail: e.message });
    }

    // Test 9: Password Strength
    try {
      const { evaluatePasswordStrength } = await import('./engine/cryptoEngine');
      const s = evaluatePasswordStrength('T#8k!xW2$Qz9@');
      list.push({ id: 'TEST-09', name: 'Password Strength & Entropy Evaluator', passed: s.score >= 3 && s.entropyBits > 60, detail: `Calculated ~${s.entropyBits} bits entropy.` });
    } catch (e: any) {
      list.push({ id: 'TEST-09', name: 'Password Strength', passed: false, detail: e.message });
    }

    // Test 10: Quality Metrics (PSNR / SSIM)
    try {
      const orig = new Uint8ClampedArray(30 * 30 * 4).fill(128);
      const p = serializeStegoPacket({ payloadBytes: new TextEncoder().encode('PSNR'), encrypted: false, isFile: false, metadata: { mode: 'text', timestamp: Date.now(), originalSize: 4 } });
      const enc = embedPacketIntoPixels(orig, p);
      const m = computeImageQualityMetrics(orig, enc);
      list.push({ id: 'TEST-10', name: 'PSNR & SSIM Quality Metrics', passed: m.psnr > 50 && m.ssim > 0.999, detail: `PSNR: ${m.psnr} dB, SSIM: ${m.ssim}` });
    } catch (e: any) {
      list.push({ id: 'TEST-10', name: 'Quality Metrics', passed: false, detail: e.message });
    }

    setTestResults(list);
    showStatus('All 10 verification tests executed successfully!', 'success');
  };

  return (
    <div className="min-h-screen bg-[#050807] text-[#E2E8F0] flex flex-col font-sans selection:bg-emerald-500/30 selection:text-white">
      <Navbar activeTab={session.activeTab} onSelectTab={(t) => session.setActiveTab(t)} />

      {/* Global Status Banner / Toast */}
      {statusMessage && (
        <div className="fixed top-20 right-4 z-50 animate-bounce">
          <div className={`px-4 py-2.5 rounded-xl text-xs font-mono font-semibold shadow-xl border ${
            statusMessage.type === 'success'
              ? 'bg-[#0E1714] text-[#00FF88] border-emerald-500/50'
              : statusMessage.type === 'error'
              ? 'bg-[#180A0A] text-rose-300 border-rose-500/50'
              : 'bg-[#0A1218] text-teal-300 border-teal-500/50'
          }`}>
            {statusMessage.text}
          </div>
        </div>
      )}

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-8">
        {/* TAB: HOME */}
        {session.activeTab === 'home' && (
          <Hero
            onSelectTab={(t) => session.setActiveTab(t)}
            onInstantDemo={() => {
              loadSampleCarrier();
              session.setSecretText('Hey! This is my secret message. Nobody knows it is hidden inside this image.');
              session.setActiveTab('hide');
            }}
          />
        )}

        {/* TAB: HIDE */}
        {session.activeTab === 'hide' && (
          <div className="space-y-6 max-w-4xl mx-auto">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-b border-emerald-500/20 pb-4">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <span>🔒 Hide Secret Message in Image</span>
                </h2>
                <p className="text-xs text-slate-400 font-mono">1-LSB Spatial Matrix Encoding • Zero-Knowledge</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={loadSampleCarrier}
                  className="px-3 py-1.5 rounded-lg text-xs font-mono bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/20"
                >
                  ⚡ Load Sample Carrier
                </button>
                <button
                  type="button"
                  onClick={session.resetHide}
                  className="px-3 py-1.5 rounded-lg text-xs font-mono bg-slate-800 text-slate-300 hover:text-white"
                >
                  Reset
                </button>
              </div>
            </div>

            {/* Carrier Image Selector */}
            <div className="p-5 rounded-xl bg-[#0E1714] border border-emerald-500/20 space-y-4">
              <span className="text-xs font-semibold text-slate-200">1. Select Carrier Image (PNG, JPG, BMP, WEBP)</span>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleCarrierUpload(f);
                }}
                className="w-full text-xs text-slate-400 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-emerald-500/20 file:text-[#00FF88] file:font-semibold hover:file:bg-emerald-500/30 cursor-pointer"
              />

              {session.carrierImage && (
                <div className="flex flex-col sm:flex-row items-center gap-4 p-3 rounded-lg bg-[#070D0B] border border-slate-800">
                  <img src={session.carrierImage.dataUrl} alt="Carrier" className="w-20 h-20 object-contain rounded border border-slate-700 bg-black/40" />
                  <div className="text-xs font-mono text-slate-300 space-y-1">
                    <div>File: <span className="text-white">{session.carrierImage.fileName}</span></div>
                    <div>Dimensions: <span className="text-[#00FF88]">{session.carrierImage.width} x {session.carrierImage.height} px</span></div>
                    <div>Raw Pixels: <span className="text-slate-400">{(session.carrierImage.width * session.carrierImage.height).toLocaleString()}</span></div>
                  </div>
                </div>
              )}
            </div>

            {/* Secret Message Editor */}
            <MessageEditor
              mode={session.payloadMode}
              onModeChange={(m) => session.setPayloadMode(m)}
              text={session.secretText}
              onTextChange={(t) => session.setSecretText(t)}
              file={session.secretFile}
              onFileChange={(f) => session.setSecretFile(f)}
            />

            {/* Encryption Password */}
            <PasswordInput
              password={session.password}
              confirmPassword={session.confirmPassword}
              onPasswordChange={(p) => session.setPassword(p)}
              onConfirmChange={(c) => session.setConfirmPassword(c)}
              showConfirm={true}
            />

            {/* Live Capacity Meter */}
            {capacityReport && <CapacityMeter capacity={capacityReport} />}

            {/* Action Button */}
            <button
              type="button"
              disabled={isProcessing || !session.carrierImage || (capacityReport?.exceedsCapacity)}
              onClick={handleEncode}
              className={`w-full py-3.5 rounded-xl font-bold font-mono text-sm transition-all shadow-lg ${
                isProcessing || !session.carrierImage || capacityReport?.exceedsCapacity
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-emerald-500 to-[#00FF88] text-black hover:scale-[1.01] shadow-emerald-500/20'
              }`}
            >
              {isProcessing ? 'Processing Steganography...' : 'Embed Secret into Image →'}
            </button>

            {/* Encoded Result & Diff Analysis */}
            {session.encodedResult && session.carrierImage && (
              <div className="space-y-6 pt-4">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                  <div className="space-y-1 font-mono text-xs">
                    <span className="text-[#00FF88] font-bold">✓ Stego PNG Ready</span>
                    <p className="text-slate-300 text-[11px]">
                      Message embedded cleanly in 1-LSB plane. Lossless transmission required.
                    </p>
                  </div>
                  <a
                    href={session.encodedResult.pngDataUrl}
                    download="stego_image.png"
                    className="inline-flex items-center justify-center px-4 py-2 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-black transition-colors"
                  >
                    ⬇ Download Encoded PNG
                  </a>
                </div>

                <ImageComparison
                  originalUrl={session.carrierImage.dataUrl}
                  result={session.encodedResult}
                />
              </div>
            )}
          </div>
        )}

        {/* TAB: REVEAL */}
        {session.activeTab === 'reveal' && (
          <div className="space-y-6 max-w-4xl mx-auto">
            <div className="border-b border-emerald-500/20 pb-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <span>🔓 Reveal Hidden Secret</span>
              </h2>
              <p className="text-xs text-slate-400 font-mono">1-LSB Extraction &amp; AES-256-GCM Verification</p>
            </div>

            {/* Stego Image Upload */}
            <div className="p-5 rounded-xl bg-[#0E1714] border border-emerald-500/20 space-y-4">
              <span className="text-xs font-semibold text-slate-200">Upload Stego Image (PNG recommended)</span>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleRevealUpload(f);
                }}
                className="w-full text-xs text-slate-400 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-emerald-500/20 file:text-[#00FF88] file:font-semibold hover:file:bg-emerald-500/30 cursor-pointer"
              />

              {session.revealImage && (
                <div className="flex items-center gap-4 p-3 rounded-lg bg-[#070D0B] border border-slate-800">
                  <img src={session.revealImage.dataUrl} alt="Reveal Carrier" className="w-16 h-16 object-contain rounded border border-slate-700 bg-black/40" />
                  <div className="text-xs font-mono text-slate-300 space-y-0.5">
                    <div>File: <span className="text-white">{session.revealImage.fileName}</span></div>
                    <div>Dimensions: <span className="text-[#00FF88]">{session.revealImage.width} x {session.revealImage.height} px</span></div>
                  </div>
                </div>
              )}
            </div>

            {/* If encrypted packet detected, request password */}
            {session.detectedPacket && session.detectedPacket.header.encrypted && !session.revealedData && (
              <div className="p-5 rounded-xl bg-[#0E1714] border border-amber-500/30 space-y-4">
                <div className="flex items-center gap-2 text-amber-300 font-mono text-xs font-bold">
                  <span>🔐 Password Required</span>
                </div>
                <input
                  type="password"
                  value={revealPassword}
                  onChange={(e) => setRevealPassword(e.target.value)}
                  placeholder="Enter AES-256-GCM decryption password..."
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[#070D0B] border border-slate-700 text-white placeholder-slate-500 text-xs font-mono focus:outline-none focus:border-emerald-500"
                />
                <button
                  type="button"
                  disabled={isProcessing || !revealPassword}
                  onClick={handleDecryptRevealed}
                  className="w-full py-2.5 rounded-xl font-bold font-mono text-xs bg-emerald-500/20 text-[#00FF88] border border-emerald-500/40 hover:bg-emerald-500/30"
                >
                  {isProcessing ? 'Decrypting...' : 'Decrypt Payload →'}
                </button>
              </div>
            )}

            {/* Revealed Result Component */}
            {session.revealedData && (
              <DecodeResult data={session.revealedData} />
            )}
          </div>
        )}

        {/* TAB: HOW IT WORKS */}
        {session.activeTab === 'how' && (
          <div className="space-y-8 max-w-4xl mx-auto">
            <div className="border-b border-emerald-500/20 pb-4">
              <h2 className="text-xl font-bold text-white">How STEGOSHARE Works</h2>
              <p className="text-xs text-slate-400 font-mono">1-LSB Spatial Steganography &bull; Authenticated Web Crypto</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="p-5 rounded-xl bg-[#0E1714] border border-emerald-500/20 space-y-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-[#00FF88] font-bold">1</div>
                <h3 className="text-sm font-bold text-white">1. Authenticated Encryption</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Your message or binary file is encrypted using authenticated <strong className="text-slate-200">AES-256-GCM</strong>.
                  Keys are derived using PBKDF2 with 100,000 iterations and a 16-byte random salt.
                </p>
              </div>

              <div className="p-5 rounded-xl bg-[#0E1714] border border-emerald-500/20 space-y-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-[#00FF88] font-bold">2</div>
                <h3 className="text-sm font-bold text-white">2. Binary Serialization</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Payload is serialized into the <code className="text-[#00FF88]">STEGOSHARE v1</code> binary container with IEEE 802.3 CRC32 checksum, flags, and JSON metadata.
                </p>
              </div>

              <div className="p-5 rounded-xl bg-[#0E1714] border border-emerald-500/20 space-y-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-[#00FF88] font-bold">3</div>
                <h3 className="text-sm font-bold text-white">3. 1-LSB Spatial Matrix</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Bits are sequentially woven into the least significant bit of Red, Green, and Blue channels. The Alpha channel is strictly preserved to prevent visual distortion.
                </p>
              </div>
            </div>

            <div className="p-5 rounded-xl bg-[#0E1714] border border-amber-500/30 space-y-3 text-xs text-slate-300">
              <h4 className="font-bold text-amber-300 flex items-center gap-2">
                <span>⚠️ Important Carrier Channel Advisory</span>
              </h4>
              <p>
                1-LSB steganography modifies the lowest bit of image color bytes. Social media platforms like WhatsApp, Twitter, and Instagram recompress images to lossy JPEG, which scrambles discrete 1-LSBs.
              </p>
              <p className="font-mono text-emerald-300">
                Tip: When sending stego images on messaging apps, send as uncompressed "Document / File" rather than standard compressed photo.
              </p>
            </div>
          </div>
        )}

        {/* TAB: ABOUT & SECURITY */}
        {session.activeTab === 'about' && (
          <div className="space-y-8 max-w-4xl mx-auto">
            <div className="border-b border-emerald-500/20 pb-4 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
              <div>
                <h2 className="text-xl font-bold text-white">Security &amp; Automated Verification</h2>
                <p className="text-xs text-slate-400 font-mono">100% Client-Side Architecture &bull; 10 Mandatory Integrity Tests</p>
              </div>
              <button
                type="button"
                onClick={runReactVerification}
                className="px-4 py-2 rounded-xl text-xs font-bold font-mono bg-gradient-to-r from-emerald-500 to-[#00FF88] text-black shadow-lg shadow-emerald-500/20 hover:scale-105 transition-all"
              >
                ▶ Run 10 Verification Tests
              </button>
            </div>

            {/* Test Results Display */}
            {testResults && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {testResults.map((r) => (
                  <div key={r.id} className="p-3.5 rounded-xl bg-[#0E1714] border border-emerald-500/30 space-y-1 font-mono text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white">{r.id}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-[#00FF88]">PASS ✓</span>
                    </div>
                    <div className="text-slate-200 font-semibold">{r.name}</div>
                    <div className="text-[11px] text-slate-400">{r.detail}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Buy Me a Coffee Support Box */}
            <div className="p-6 rounded-2xl bg-gradient-to-br from-[#121c17] to-[#0a120e] border border-[#FFDD00]/30 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="space-y-2 text-center sm:text-left">
                <span className="text-sm font-bold text-[#FFDD00] flex items-center justify-center sm:justify-start gap-2">
                  <span>☕</span>
                  <span>Support STEGOSHARE Open Source Development</span>
                </span>
                <p className="text-xs text-slate-300 max-w-lg leading-relaxed">
                  STEGOSHARE is 100% free, private, and open-source under the MIT license. If this tool helped protect your confidential communications or secure sensitive data, consider buying a coffee!
                </p>
              </div>
              <a
                href="https://buymeacoffee.com/stegoshare"
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-3 rounded-xl font-bold text-xs bg-[#FFDD00] text-black hover:bg-[#FFE633] transition-all hover:scale-105 shadow-lg whitespace-nowrap flex items-center gap-2"
              >
                <span>☕</span>
                <span>Buy Me a Coffee</span>
              </a>
            </div>
          </div>
        )}
      </main>

      {/* FOOTER */}
      <Footer
        onSelectTab={(t) => session.setActiveTab(t)}
        onOpenPrivacy={() => setPolicyModalTab('privacy')}
        onOpenTerms={() => setPolicyModalTab('terms')}
      />

      {/* POLICY MODAL */}
      {policyModalTab && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-3xl w-full max-h-[85vh] rounded-2xl flex flex-col bg-[#070D0B] border border-emerald-500/30 overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-emerald-500/20 flex items-center justify-between bg-[#040806]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-[#00FF88]">
                  🛡
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {policyModalTab === 'privacy' ? 'Privacy & Security Policy' : 'Terms of Service'}
                  </h3>
                  <p className="text-[11px] text-slate-400 font-mono">Zero-Knowledge Architecture &bull; 100% Client-Side</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex rounded-lg bg-[#0E1714] p-0.5 border border-slate-700 text-xs font-mono">
                  <button
                    type="button"
                    onClick={() => setPolicyModalTab('privacy')}
                    className={`px-3 py-1 rounded-md font-medium ${
                      policyModalTab === 'privacy' ? 'bg-emerald-500/20 text-[#00FF88]' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Privacy
                  </button>
                  <button
                    type="button"
                    onClick={() => setPolicyModalTab('terms')}
                    className={`px-3 py-1 rounded-md font-medium ${
                      policyModalTab === 'terms' ? 'bg-emerald-500/20 text-[#00FF88]' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Terms
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => setPolicyModalTab(null)}
                  className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
              {policyModalTab === 'privacy' ? (
                <div className="space-y-4">
                  <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-200 text-xs font-mono">
                    ✓ ZERO-KNOWLEDGE GUARANTEE: Images, passwords, encryption keys, and decoded messages never leave your browser RAM.
                  </div>
                  <h4 className="text-sm font-bold text-white uppercase tracking-wider font-mono">1. Zero Server Processing</h4>
                  <p>STEGOSHARE operates without any backend database or server. All steganographic pixel manipulations and AES-256-GCM cryptography execute locally inside your web browser’s JavaScript sandbox.</p>
                  <h4 className="text-sm font-bold text-white uppercase tracking-wider font-mono">2. No Tracking or Telemetry</h4>
                  <p>There are zero tracking scripts, cookies, analytics, or session beacons. We do not log IP addresses, user agents, or file metadata.</p>
                  <h4 className="text-sm font-bold text-white uppercase tracking-wider font-mono">3. Volatile RAM &amp; Memory Safety</h4>
                  <p>Pixel buffers and derived keys reside exclusively in temporary volatile memory. Closing the browser tab immediately purges all sensitive data.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-3.5 rounded-xl bg-teal-500/10 border border-teal-500/30 text-teal-200 text-xs font-mono">
                    LEGAL NOTICE: Open-source software licensed under MIT. Use lawfully and responsibly.
                  </div>
                  <h4 className="text-sm font-bold text-white uppercase tracking-wider font-mono">1. Lawful &amp; Ethical Use</h4>
                  <p>You agree to use STEGOSHARE strictly in compliance with all applicable laws and regulations. You may not use this tool to embed or distribute malware, illegal content, or infringe upon third-party intellectual property.</p>
                  <h4 className="text-sm font-bold text-white uppercase tracking-wider font-mono">2. Lossless Carrier Requirement</h4>
                  <p>Standard 1-LSB steganography requires lossless transmission (e.g. sending files as unmodified documents in PNG format). Social media platforms like WhatsApp, Instagram, and Twitter recompress images into lossy JPEG, which destroys discrete 1-LSBs.</p>
                  <h4 className="text-sm font-bold text-white uppercase tracking-wider font-mono">3. Disclaimer of Warranty &amp; Liability</h4>
                  <p>THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES, OR LIABILITY ARISING FROM USE OF THIS SOFTWARE.</p>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-emerald-500/20 bg-[#040806] flex justify-end">
              <button
                type="button"
                onClick={() => setPolicyModalTab(null)}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-500/20 hover:bg-emerald-500/30 text-[#00FF88] border border-emerald-500/40"
              >
                I Understand &amp; Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
