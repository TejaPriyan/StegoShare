import { useState } from 'react';
import { CapacityReport, ImageQualityMetrics, SerializedHeaderInfo } from '../types/stego';

export interface CarrierImageState {
  width: number;
  height: number;
  pixels: Uint8ClampedArray;
  dataUrl: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  isLossy: boolean;
}

export interface SecretFileState {
  name: string;
  size: number;
  mimeType: string;
  bytes: Uint8Array;
}

export interface EncodedResultState {
  pngDataUrl: string;
  diffDataUrl: string;
  encodedPixels: Uint8ClampedArray;
  packetLength: number;
  crcHex: string;
  encrypted: boolean;
  metrics: ImageQualityMetrics;
  width: number;
  height: number;
  capacityPercentage: number;
}

export interface RevealedDataState {
  mode: 'text' | 'file';
  text: string;
  fileBytes: Uint8Array;
  filename: string;
  mimeType: string;
  encrypted: boolean;
  payloadLength: number;
  timestamp: number;
}

export function useStegoSession() {
  const [activeTab, setActiveTab] = useState<'home' | 'hide' | 'reveal' | 'how' | 'about'>('home');
  const [carrierImage, setCarrierImage] = useState<CarrierImageState | null>(null);
  const [payloadMode, setPayloadMode] = useState<'text' | 'file'>('text');
  const [secretText, setSecretText] = useState('');
  const [secretFile, setSecretFile] = useState<SecretFileState | null>(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [encodedResult, setEncodedResult] = useState<EncodedResultState | null>(null);

  // Reveal state
  const [revealImage, setRevealImage] = useState<CarrierImageState | null>(null);
  const [detectedPacket, setDetectedPacket] = useState<{ header: SerializedHeaderInfo; payloadBytes: Uint8Array } | null>(null);
  const [revealedData, setRevealedData] = useState<RevealedDataState | null>(null);

  const resetHide = () => {
    setSecretText('');
    setPassword('');
    setConfirmPassword('');
    setSecretFile(null);
    setEncodedResult(null);
  };

  const resetAll = () => {
    resetHide();
    setCarrierImage(null);
    setRevealImage(null);
    setDetectedPacket(null);
    setRevealedData(null);
  };

  return {
    activeTab, setActiveTab,
    carrierImage, setCarrierImage,
    payloadMode, setPayloadMode,
    secretText, setSecretText,
    secretFile, setSecretFile,
    password, setPassword,
    confirmPassword, setConfirmPassword,
    encodedResult, setEncodedResult,
    revealImage, setRevealImage,
    detectedPacket, setDetectedPacket,
    revealedData, setRevealedData,
    resetHide,
    resetAll,
  };
}
