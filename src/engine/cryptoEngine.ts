/**
 * STEGOSHARE Cryptographic Engine
 * Uses Web Crypto API (AES-256-GCM + PBKDF2-SHA256, 100,000 iterations)
 * with robust pure-JS fallback for insecure origins and sandboxed iframes.
 */

export const PBKDF2_ITERATIONS = 100000;
export const SALT_LENGTH = 16;
export const NONCE_LENGTH = 12;
export const GCM_TAG_BYTE_LENGTH = 16;

export interface EncryptedBundle {
  ciphertext: Uint8Array;
  salt: Uint8Array;
  nonce: Uint8Array;
}

// Pure JS Crypto Engine Fallback
const SBOX = new Uint8Array([
  0x63, 0x7c, 0x77, 0x7b, 0xf2, 0x6b, 0x6f, 0xc5, 0x30, 0x01, 0x67, 0x2b, 0xfe, 0xd7, 0xab, 0x76,
  0xca, 0x82, 0xc9, 0x7d, 0xfa, 0x59, 0x47, 0xf0, 0xad, 0xd4, 0xa2, 0xaf, 0x9c, 0xa4, 0x72, 0xc0,
  0xb7, 0xfd, 0x93, 0x26, 0x36, 0x3f, 0xf7, 0xcc, 0x34, 0xa5, 0xe5, 0xf1, 0x71, 0xd8, 0x31, 0x15,
  0x04, 0xc7, 0x23, 0xc3, 0x18, 0x96, 0x05, 0x9a, 0x07, 0x12, 0x80, 0xe2, 0xeb, 0x27, 0xb2, 0x75,
  0x09, 0x83, 0x2c, 0x1a, 0x1b, 0x6e, 0x5a, 0xa0, 0x52, 0x3b, 0xd6, 0xb3, 0x29, 0xe3, 0x2f, 0x84,
  0x53, 0xd1, 0x00, 0xed, 0x20, 0xfc, 0xb1, 0x5b, 0x6a, 0xcb, 0xbe, 0x39, 0x4a, 0x4c, 0x58, 0xcf,
  0xd0, 0xef, 0xaa, 0xfb, 0x43, 0x4d, 0x33, 0x85, 0x45, 0xf9, 0x02, 0x7f, 0x50, 0x3c, 0x9f, 0xa8,
  0x51, 0xa3, 0x40, 0x8f, 0x92, 0x9d, 0x38, 0xf5, 0xbc, 0xb6, 0xda, 0x21, 0x10, 0xff, 0xf3, 0xd2,
  0xcd, 0x0c, 0x13, 0xec, 0x5f, 0x97, 0x44, 0x17, 0xc4, 0xa7, 0x7e, 0x3d, 0x64, 0x5d, 0x19, 0x73,
  0x60, 0x81, 0x4f, 0xdc, 0x22, 0x2a, 0x90, 0x88, 0x46, 0xee, 0xb8, 0x14, 0xde, 0x5e, 0x0b, 0xdb,
  0xe0, 0x32, 0x3a, 0x0a, 0x49, 0x06, 0x24, 0x5c, 0xc2, 0xd3, 0xac, 0x62, 0x91, 0x95, 0xe4, 0x79,
  0xe7, 0xc8, 0x37, 0x6d, 0x8d, 0xd5, 0x4e, 0xa9, 0x6c, 0x56, 0xf4, 0xea, 0x65, 0x7a, 0xae, 0x08,
  0xba, 0x78, 0x25, 0x2e, 0x1c, 0xa6, 0xb4, 0xc6, 0xe8, 0xdd, 0x74, 0x1f, 0x4b, 0xbd, 0x8b, 0x8a,
  0x70, 0x3e, 0xb5, 0x66, 0x48, 0x03, 0xf6, 0x0e, 0x61, 0x35, 0x57, 0xb9, 0x86, 0xc1, 0x1d, 0x9e,
  0xe1, 0xf8, 0x98, 0x11, 0x69, 0xd9, 0x8e, 0x94, 0x9b, 0x1e, 0x87, 0xe9, 0xce, 0x55, 0x28, 0xdf,
  0x8c, 0xa1, 0x89, 0x0d, 0xbf, 0xe6, 0x42, 0x68, 0x41, 0x99, 0x2d, 0x0f, 0xb0, 0x54, 0xbb, 0x16
]);
const RCON = [0x00, 0x01, 0x02, 0x04, 0x08, 0x10, 0x20, 0x40, 0x80, 0x1b, 0x36];
const XTIME = new Uint8Array(256);
for (let i = 0; i < 256; i++) {
  XTIME[i] = ((i << 1) ^ (i & 0x80 ? 0x1b : 0)) & 0xFF;
}
const K = [
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
  0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
];

function subWord(w: number): number {
  return (SBOX[(w >>> 24) & 0xFF] << 24) |
         (SBOX[(w >>> 16) & 0xFF] << 16) |
         (SBOX[(w >>> 8) & 0xFF] << 8) |
         SBOX[w & 0xFF];
}

function keyExpansion256(key: Uint8Array): Uint32Array {
  const w = new Uint32Array(60);
  for (let i = 0; i < 8; i++) {
    w[i] = (key[4 * i] << 24) | (key[4 * i + 1] << 16) | (key[4 * i + 2] << 8) | key[4 * i + 3];
  }
  for (let i = 8; i < 60; i++) {
    let temp = w[i - 1];
    if (i % 8 === 0) {
      const rot = (temp << 8) | (temp >>> 24);
      temp = subWord(rot) ^ (RCON[Math.floor(i / 8)] << 24);
    } else if (i % 8 === 4) {
      temp = subWord(temp);
    }
    w[i] = (w[i - 8] ^ temp) >>> 0;
  }
  return w;
}

function mix(col: number): number {
  const b0 = (col >>> 24) & 0xFF, b1 = (col >>> 16) & 0xFF, b2 = (col >>> 8) & 0xFF, b3 = col & 0xFF;
  const x0 = XTIME[b0], x1 = XTIME[b1], x2 = XTIME[b2], x3 = XTIME[b3];
  return ((x0 ^ b1 ^ x1 ^ b2 ^ b3) << 24) |
         ((b0 ^ x1 ^ b2 ^ x2 ^ b3) << 16) |
         ((b0 ^ b1 ^ x2 ^ b3 ^ x3) << 8) |
         (b0 ^ x0 ^ b1 ^ b2 ^ x3);
}

function aesEncryptBlock(w: Uint32Array, input: Uint8Array, out: Uint8Array, outOff = 0): void {
  let s0 = (input[0] << 24) | (input[1] << 16) | (input[2] << 8) | input[3];
  let s1 = (input[4] << 24) | (input[5] << 16) | (input[6] << 8) | input[7];
  let s2 = (input[8] << 24) | (input[9] << 16) | (input[10] << 8) | input[11];
  let s3 = (input[12] << 24) | (input[13] << 16) | (input[14] << 8) | input[15];

  s0 ^= w[0]; s1 ^= w[1]; s2 ^= w[2]; s3 ^= w[3];

  for (let r = 1; r < 14; r++) {
    const rw = r * 4;
    const t0 = (SBOX[(s0 >>> 24) & 0xFF] << 24) | (SBOX[(s1 >>> 16) & 0xFF] << 16) | (SBOX[(s2 >>> 8) & 0xFF] << 8) | SBOX[s3 & 0xFF];
    const t1 = (SBOX[(s1 >>> 24) & 0xFF] << 24) | (SBOX[(s2 >>> 16) & 0xFF] << 16) | (SBOX[(s3 >>> 8) & 0xFF] << 8) | SBOX[s0 & 0xFF];
    const t2 = (SBOX[(s2 >>> 24) & 0xFF] << 24) | (SBOX[(s3 >>> 16) & 0xFF] << 16) | (SBOX[(s0 >>> 8) & 0xFF] << 8) | SBOX[s1 & 0xFF];
    const t3 = (SBOX[(s3 >>> 24) & 0xFF] << 24) | (SBOX[(s0 >>> 16) & 0xFF] << 16) | (SBOX[(s1 >>> 8) & 0xFF] << 8) | SBOX[s2 & 0xFF];

    s0 = (mix(t0) ^ w[rw]) >>> 0;
    s1 = (mix(t1) ^ w[rw + 1]) >>> 0;
    s2 = (mix(t2) ^ w[rw + 2]) >>> 0;
    s3 = (mix(t3) ^ w[rw + 3]) >>> 0;
  }

  const t0 = (SBOX[(s0 >>> 24) & 0xFF] << 24) | (SBOX[(s1 >>> 16) & 0xFF] << 16) | (SBOX[(s2 >>> 8) & 0xFF] << 8) | SBOX[s3 & 0xFF];
  const t1 = (SBOX[(s1 >>> 24) & 0xFF] << 24) | (SBOX[(s2 >>> 16) & 0xFF] << 16) | (SBOX[(s3 >>> 8) & 0xFF] << 8) | SBOX[s0 & 0xFF];
  const t2 = (SBOX[(s2 >>> 24) & 0xFF] << 24) | (SBOX[(s3 >>> 16) & 0xFF] << 16) | (SBOX[(s0 >>> 8) & 0xFF] << 8) | SBOX[s1 & 0xFF];
  const t3 = (SBOX[(s3 >>> 24) & 0xFF] << 24) | (SBOX[(s0 >>> 16) & 0xFF] << 16) | (SBOX[(s1 >>> 8) & 0xFF] << 8) | SBOX[s2 & 0xFF];

  s0 = (t0 ^ w[56]) >>> 0;
  s1 = (t1 ^ w[57]) >>> 0;
  s2 = (t2 ^ w[58]) >>> 0;
  s3 = (t3 ^ w[59]) >>> 0;

  out[outOff] = (s0 >>> 24) & 0xFF; out[outOff + 1] = (s0 >>> 16) & 0xFF; out[outOff + 2] = (s0 >>> 8) & 0xFF; out[outOff + 3] = s0 & 0xFF;
  out[outOff + 4] = (s1 >>> 24) & 0xFF; out[outOff + 5] = (s1 >>> 16) & 0xFF; out[outOff + 6] = (s1 >>> 8) & 0xFF; out[outOff + 7] = s1 & 0xFF;
  out[outOff + 8] = (s2 >>> 24) & 0xFF; out[outOff + 9] = (s2 >>> 16) & 0xFF; out[outOff + 10] = (s2 >>> 8) & 0xFF; out[outOff + 11] = s2 & 0xFF;
  out[outOff + 12] = (s3 >>> 24) & 0xFF; out[outOff + 13] = (s3 >>> 16) & 0xFF; out[outOff + 14] = (s3 >>> 8) & 0xFF; out[outOff + 15] = s3 & 0xFF;
}

function ghashMultiply(x: Uint8Array, y: Uint8Array): Uint8Array {
  let z0 = 0, z1 = 0, z2 = 0, z3 = 0;
  let v0 = (y[0] << 24) | (y[1] << 16) | (y[2] << 8) | y[3];
  let v1 = (y[4] << 24) | (y[5] << 16) | (y[6] << 8) | y[7];
  let v2 = (y[8] << 24) | (y[9] << 16) | (y[10] << 8) | y[11];
  let v3 = (y[12] << 24) | (y[13] << 16) | (y[14] << 8) | y[15];

  for (let i = 0; i < 16; i++) {
    const byte = x[i];
    for (let j = 7; j >= 0; j--) {
      if ((byte >>> j) & 1) {
        z0 ^= v0; z1 ^= v1; z2 ^= v2; z3 ^= v3;
      }
      const lsb = v3 & 1;
      v3 = (v3 >>> 1) | ((v2 & 1) << 31);
      v2 = (v2 >>> 1) | ((v1 & 1) << 31);
      v1 = (v1 >>> 1) | ((v0 & 1) << 31);
      v0 = (v0 >>> 1);
      if (lsb) {
        v0 ^= 0xe1000000;
      }
    }
  }

  const out = new Uint8Array(16);
  out[0] = (z0 >>> 24) & 0xFF; out[1] = (z0 >>> 16) & 0xFF; out[2] = (z0 >>> 8) & 0xFF; out[3] = z0 & 0xFF;
  out[4] = (z1 >>> 24) & 0xFF; out[5] = (z1 >>> 16) & 0xFF; out[6] = (z1 >>> 8) & 0xFF; out[7] = z1 & 0xFF;
  out[8] = (z2 >>> 24) & 0xFF; out[9] = (z2 >>> 16) & 0xFF; out[10] = (z2 >>> 8) & 0xFF; out[11] = z2 & 0xFF;
  out[12] = (z3 >>> 24) & 0xFF; out[13] = (z3 >>> 16) & 0xFF; out[14] = (z3 >>> 8) & 0xFF; out[15] = z3 & 0xFF;
  return out;
}

function sha256Block(state: Uint32Array, W: Uint32Array): void {
  let a = state[0], b = state[1], c = state[2], d = state[3];
  let e = state[4], f = state[5], g = state[6], h = state[7];

  for (let t = 0; t < 64; t++) {
    const S1 = ((e >>> 6) | (e << 26)) ^ ((e >>> 11) | (e << 21)) ^ ((e >>> 25) | (e << 7));
    const ch = (e & f) ^ (~e & g);
    const temp1 = (h + S1 + ch + K[t] + W[t]) >>> 0;
    const S0 = ((a >>> 2) | (a << 30)) ^ ((a >>> 13) | (a << 19)) ^ ((a >>> 22) | (a << 10));
    const maj = (a & b) ^ (a & c) ^ (b & c);
    const temp2 = (S0 + maj) >>> 0;

    h = g; g = f; f = e; e = (d + temp1) >>> 0;
    d = c; c = b; b = a; a = (temp1 + temp2) >>> 0;
  }

  state[0] = (state[0] + a) >>> 0;
  state[1] = (state[1] + b) >>> 0;
  state[2] = (state[2] + c) >>> 0;
  state[3] = (state[3] + d) >>> 0;
  state[4] = (state[4] + e) >>> 0;
  state[5] = (state[5] + f) >>> 0;
  state[6] = (state[6] + g) >>> 0;
  state[7] = (state[7] + h) >>> 0;
}

function sha256(data: Uint8Array): Uint8Array {
  let H0 = 0x6a09e667, H1 = 0xbb67ae85, H2 = 0x3c6ef372, H3 = 0xa54ff53a;
  let H4 = 0x510e527f, H5 = 0x9b05688c, H6 = 0x1f83d9ab, H7 = 0x5be0cd19;

  const len = data.length;
  const padLen = (((len + 8) >> 6) + 1) << 6;
  const words = new Uint32Array(padLen >> 2);
  for (let i = 0; i < len; i++) {
    words[i >> 2] |= data[i] << (24 - (i & 3) * 8);
  }
  words[len >> 2] |= 0x80 << (24 - (len & 3) * 8);
  words[words.length - 1] = (len * 8) >>> 0;
  words[words.length - 2] = Math.floor((len * 8) / 0x100000000);

  const W = new Uint32Array(64);
  const state = new Uint32Array(8);

  for (let i = 0; i < words.length; i += 16) {
    for (let t = 0; t < 16; t++) W[t] = words[i + t];
    for (let t = 16; t < 64; t++) {
      const s0 = ((W[t - 15] >>> 7) | (W[t - 15] << 25)) ^ ((W[t - 15] >>> 18) | (W[t - 15] << 14)) ^ (W[t - 15] >>> 3);
      const s1 = ((W[t - 2] >>> 17) | (W[t - 2] << 15)) ^ ((W[t - 2] >>> 19) | (W[t - 2] << 13)) ^ (W[t - 2] >>> 10);
      W[t] = (W[t - 16] + s0 + W[t - 7] + s1) >>> 0;
    }
    state[0] = H0; state[1] = H1; state[2] = H2; state[3] = H3;
    state[4] = H4; state[5] = H5; state[6] = H6; state[7] = H7;
    sha256Block(state, W);
    H0 = state[0]; H1 = state[1]; H2 = state[2]; H3 = state[3];
    H4 = state[4]; H5 = state[5]; H6 = state[6]; H7 = state[7];
  }

  const out = new Uint8Array(32);
  const outH = [H0, H1, H2, H3, H4, H5, H6, H7];
  for (let i = 0; i < 8; i++) {
    out[i * 4] = (outH[i] >>> 24) & 0xFF;
    out[i * 4 + 1] = (outH[i] >>> 16) & 0xFF;
    out[i * 4 + 2] = (outH[i] >>> 8) & 0xFF;
    out[i * 4 + 3] = outH[i] & 0xFF;
  }
  return out;
}

function fastPbkdf2Sha256(passwordStr: string, saltBytes: Uint8Array, iterations = 100000, keyLen = 32): Uint8Array {
  const enc = new TextEncoder();
  let key: Uint8Array = enc.encode(passwordStr);
  if (key.length > 64) key = sha256(key);

  const kPad = new Uint8Array(64);
  kPad.set(key, 0);

  const iKeyPad = new Uint32Array(16);
  const oKeyPad = new Uint32Array(16);
  for (let i = 0; i < 16; i++) {
    const kWord = (kPad[i * 4] << 24) | (kPad[i * 4 + 1] << 16) | (kPad[i * 4 + 2] << 8) | kPad[i * 4 + 3];
    iKeyPad[i] = (kWord ^ 0x36363636) >>> 0;
    oKeyPad[i] = (kWord ^ 0x5c5c5c5c) >>> 0;
  }

  const iState0 = new Uint32Array([0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19]);
  const oState0 = new Uint32Array([0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19]);

  const Winit = new Uint32Array(64);
  for (let i = 0; i < 16; i++) Winit[i] = iKeyPad[i];
  for (let t = 16; t < 64; t++) {
    const s0 = ((Winit[t - 15] >>> 7) | (Winit[t - 15] << 25)) ^ ((Winit[t - 15] >>> 18) | (Winit[t - 15] << 14)) ^ (Winit[t - 15] >>> 3);
    const s1 = ((Winit[t - 2] >>> 17) | (Winit[t - 2] << 15)) ^ ((Winit[t - 2] >>> 19) | (Winit[t - 2] << 13)) ^ (Winit[t - 2] >>> 10);
    Winit[t] = (Winit[t - 16] + s0 + Winit[t - 7] + s1) >>> 0;
  }
  sha256Block(iState0, Winit);

  for (let i = 0; i < 16; i++) Winit[i] = oKeyPad[i];
  for (let t = 16; t < 64; t++) {
    const s0 = ((Winit[t - 15] >>> 7) | (Winit[t - 15] << 25)) ^ ((Winit[t - 15] >>> 18) | (Winit[t - 15] << 14)) ^ (Winit[t - 15] >>> 3);
    const s1 = ((Winit[t - 2] >>> 17) | (Winit[t - 2] << 15)) ^ ((Winit[t - 2] >>> 19) | (Winit[t - 2] << 13)) ^ (Winit[t - 2] >>> 10);
    Winit[t] = (Winit[t - 16] + s0 + Winit[t - 7] + s1) >>> 0;
  }
  sha256Block(oState0, Winit);

  const Win = new Uint32Array(64);
  Win[8] = 0x80000000;
  Win[15] = 768;

  const Wout = new Uint32Array(64);
  Wout[8] = 0x80000000;
  Wout[15] = 768;

  const innerState = new Uint32Array(8);
  const outerState = new Uint32Array(8);

  function hmac32(uWords: Uint32Array): void {
    for (let i = 0; i < 8; i++) Win[i] = uWords[i];
    for (let t = 16; t < 64; t++) {
      const s0 = ((Win[t - 15] >>> 7) | (Win[t - 15] << 25)) ^ ((Win[t - 15] >>> 18) | (Win[t - 15] << 14)) ^ (Win[t - 15] >>> 3);
      const s1 = ((Win[t - 2] >>> 17) | (Win[t - 2] << 15)) ^ ((Win[t - 2] >>> 19) | (Win[t - 2] << 13)) ^ (Win[t - 2] >>> 10);
      Win[t] = (Win[t - 16] + s0 + Win[t - 7] + s1) >>> 0;
    }
    for (let i = 0; i < 8; i++) innerState[i] = iState0[i];
    sha256Block(innerState, Win);

    for (let i = 0; i < 8; i++) Wout[i] = innerState[i];
    for (let t = 16; t < 64; t++) {
      const s0 = ((Wout[t - 15] >>> 7) | (Wout[t - 15] << 25)) ^ ((Wout[t - 15] >>> 18) | (Wout[t - 15] << 14)) ^ (Wout[t - 15] >>> 3);
      const s1 = ((Wout[t - 2] >>> 17) | (Wout[t - 2] << 15)) ^ ((Wout[t - 2] >>> 19) | (Wout[t - 2] << 13)) ^ (Wout[t - 2] >>> 10);
      Wout[t] = (Wout[t - 16] + s0 + Wout[t - 7] + s1) >>> 0;
    }
    for (let i = 0; i < 8; i++) outerState[i] = oState0[i];
    sha256Block(outerState, Wout);
    for (let i = 0; i < 8; i++) uWords[i] = outerState[i];
  }

  const numBlocks = Math.ceil(keyLen / 32);
  const outWords = new Uint32Array(numBlocks * 8);

  for (let blockIndex = 1; blockIndex <= numBlocks; blockIndex++) {
    const sLen = saltBytes.length;
    const msg = new Uint8Array(sLen + 4);
    msg.set(saltBytes, 0);
    msg[sLen] = (blockIndex >>> 24) & 0xFF;
    msg[sLen + 1] = (blockIndex >>> 16) & 0xFF;
    msg[sLen + 2] = (blockIndex >>> 8) & 0xFF;
    msg[sLen + 3] = blockIndex & 0xFF;

    const padLen = (((msg.length + 8) >> 6) + 1) << 6;
    const mWords = new Uint32Array(padLen >> 2);
    for (let i = 0; i < msg.length; i++) mWords[i >> 2] |= msg[i] << (24 - (i & 3) * 8);
    mWords[msg.length >> 2] |= 0x80 << (24 - (msg.length & 3) * 8);
    mWords[mWords.length - 1] = ((64 + msg.length) * 8) >>> 0;
    mWords[mWords.length - 2] = Math.floor(((64 + msg.length) * 8) / 0x100000000);

    for (let i = 0; i < 8; i++) innerState[i] = iState0[i];
    const Wblock = new Uint32Array(64);
    for (let i = 0; i < mWords.length; i += 16) {
      for (let t = 0; t < 16; t++) Wblock[t] = mWords[i + t];
      for (let t = 16; t < 64; t++) {
        const s0 = ((Wblock[t - 15] >>> 7) | (Wblock[t - 15] << 25)) ^ ((Wblock[t - 15] >>> 18) | (Wblock[t - 15] << 14)) ^ (Wblock[t - 15] >>> 3);
        const s1 = ((Wblock[t - 2] >>> 17) | (Wblock[t - 2] << 15)) ^ ((Wblock[t - 2] >>> 19) | (Wblock[t - 2] << 13)) ^ (Wblock[t - 2] >>> 10);
        Wblock[t] = (Wblock[t - 16] + s0 + Wblock[t - 7] + s1) >>> 0;
      }
      sha256Block(innerState, Wblock);
    }

    for (let i = 0; i < 8; i++) Wout[i] = innerState[i];
    for (let t = 16; t < 64; t++) {
      const s0 = ((Wout[t - 15] >>> 7) | (Wout[t - 15] << 25)) ^ ((Wout[t - 15] >>> 18) | (Wout[t - 15] << 14)) ^ (Wout[t - 15] >>> 3);
      const s1 = ((Wout[t - 2] >>> 17) | (Wout[t - 2] << 15)) ^ ((Wout[t - 2] >>> 19) | (Wout[t - 2] << 13)) ^ (Wout[t - 2] >>> 10);
      Wout[t] = (Wout[t - 16] + s0 + Wout[t - 7] + s1) >>> 0;
    }
    for (let i = 0; i < 8; i++) outerState[i] = oState0[i];
    sha256Block(outerState, Wout);

    const uWords = new Uint32Array(8);
    const tWords = new Uint32Array(8);
    for (let i = 0; i < 8; i++) {
      uWords[i] = outerState[i];
      tWords[i] = outerState[i];
    }

    for (let c = 1; c < iterations; c++) {
      hmac32(uWords);
      tWords[0] ^= uWords[0]; tWords[1] ^= uWords[1]; tWords[2] ^= uWords[2]; tWords[3] ^= uWords[3];
      tWords[4] ^= uWords[4]; tWords[5] ^= uWords[5]; tWords[6] ^= uWords[6]; tWords[7] ^= uWords[7];
    }

    const bOff = (blockIndex - 1) * 8;
    for (let i = 0; i < 8; i++) outWords[bOff + i] = tWords[i];
  }

  const outBytes = new Uint8Array(keyLen);
  for (let i = 0; i < keyLen; i++) {
    outBytes[i] = (outWords[i >> 2] >>> (24 - (i & 3) * 8)) & 0xFF;
  }
  return outBytes;
}

function encryptGCM(keyBytes: Uint8Array, ivBytes: Uint8Array, plaintextBytes: Uint8Array): Uint8Array {
  const w = keyExpansion256(keyBytes);
  const H = new Uint8Array(16);
  aesEncryptBlock(w, new Uint8Array(16), H);

  const J0 = new Uint8Array(16);
  J0.set(ivBytes, 0);
  J0[15] = 1;

  const cb = new Uint8Array(J0);
  function inc32(block: Uint8Array): void {
    let c = 1;
    for (let i = 15; i >= 12; i--) {
      const sum = block[i] + c;
      block[i] = sum & 0xFF;
      c = sum >>> 8;
    }
  }

  const ciphertext = new Uint8Array(plaintextBytes.length);
  const keystream = new Uint8Array(16);

  for (let i = 0; i < plaintextBytes.length; i += 16) {
    inc32(cb);
    aesEncryptBlock(w, cb, keystream);
    const blockLen = Math.min(16, plaintextBytes.length - i);
    for (let k = 0; k < blockLen; k++) {
      ciphertext[i + k] = plaintextBytes[i + k] ^ keystream[k];
    }
  }

  let S: Uint8Array = new Uint8Array(16);
  const padCt = (16 - (ciphertext.length % 16)) % 16;
  const fullCt = new Uint8Array(ciphertext.length + padCt);
  fullCt.set(ciphertext, 0);
  for (let i = 0; i < fullCt.length; i += 16) {
    for (let k = 0; k < 16; k++) S[k] ^= fullCt[i + k];
    S = ghashMultiply(S, H);
  }

  const lenBlock = new Uint8Array(16);
  const lv = new DataView(lenBlock.buffer);
  lv.setUint32(12, ciphertext.length * 8, false);
  for (let k = 0; k < 16; k++) S[k] ^= lenBlock[k];
  S = ghashMultiply(S, H);

  const tagStream = new Uint8Array(16);
  aesEncryptBlock(w, J0, tagStream);
  const tag = new Uint8Array(16);
  for (let k = 0; k < 16; k++) tag[k] = S[k] ^ tagStream[k];

  const outWithTag = new Uint8Array(ciphertext.length + 16);
  outWithTag.set(ciphertext, 0);
  outWithTag.set(tag, ciphertext.length);
  return outWithTag;
}

function decryptGCM(keyBytes: Uint8Array, ivBytes: Uint8Array, ciphertextWithTag: Uint8Array): Uint8Array {
  if (ciphertextWithTag.length < 16) {
    throw new Error('Incorrect password. Unable to decrypt this message.');
  }
  const tag = ciphertextWithTag.slice(ciphertextWithTag.length - 16);
  const ciphertext = ciphertextWithTag.slice(0, ciphertextWithTag.length - 16);

  const w = keyExpansion256(keyBytes);
  const H = new Uint8Array(16);
  aesEncryptBlock(w, new Uint8Array(16), H);

  const J0 = new Uint8Array(16);
  J0.set(ivBytes, 0);
  J0[15] = 1;

  let S: Uint8Array = new Uint8Array(16);
  const padCt = (16 - (ciphertext.length % 16)) % 16;
  const fullCt = new Uint8Array(ciphertext.length + padCt);
  fullCt.set(ciphertext, 0);
  for (let i = 0; i < fullCt.length; i += 16) {
    for (let k = 0; k < 16; k++) S[k] ^= fullCt[i + k];
    S = ghashMultiply(S, H);
  }

  const lenBlock = new Uint8Array(16);
  const lv = new DataView(lenBlock.buffer);
  lv.setUint32(12, ciphertext.length * 8, false);
  for (let k = 0; k < 16; k++) S[k] ^= lenBlock[k];
  S = ghashMultiply(S, H);

  const tagStream = new Uint8Array(16);
  aesEncryptBlock(w, J0, tagStream);
  const expectedTag = new Uint8Array(16);
  for (let k = 0; k < 16; k++) expectedTag[k] = S[k] ^ tagStream[k];

  let diff = 0;
  for (let k = 0; k < 16; k++) diff |= (tag[k] ^ expectedTag[k]);
  if (diff !== 0) {
    throw new Error('Incorrect password. Unable to decrypt this message.');
  }

  const cb = new Uint8Array(J0);
  function inc32(block: Uint8Array): void {
    let c = 1;
    for (let i = 15; i >= 12; i--) {
      const sum = block[i] + c;
      block[i] = sum & 0xFF;
      c = sum >>> 8;
    }
  }

  const plaintext = new Uint8Array(ciphertext.length);
  const keystream = new Uint8Array(16);
  for (let i = 0; i < ciphertext.length; i += 16) {
    inc32(cb);
    aesEncryptBlock(w, cb, keystream);
    const blockLen = Math.min(16, ciphertext.length - i);
    for (let k = 0; k < blockLen; k++) {
      plaintext[i + k] = ciphertext[i + k] ^ keystream[k];
    }
  }
  return plaintext;
}

export async function deriveAESKey(password: string, salt: Uint8Array): Promise<CryptoKey | Uint8Array> {
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    try {
      const encoder = new TextEncoder();
      const keyMaterial = await crypto.subtle.importKey(
        'raw',
        encoder.encode(password),
        { name: 'PBKDF2' },
        false,
        ['deriveKey']
      );

      return await crypto.subtle.deriveKey(
        {
          name: 'PBKDF2',
          salt: salt as BufferSource,
          iterations: PBKDF2_ITERATIONS,
          hash: 'SHA-256',
        },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt']
      );
    } catch {
      // Fallback below
    }
  }
  return fastPbkdf2Sha256(password, salt, PBKDF2_ITERATIONS, 32);
}

export async function encryptPayload(plaintext: Uint8Array, password: string): Promise<EncryptedBundle> {
  const salt = (typeof crypto !== 'undefined' && crypto.getRandomValues)
    ? crypto.getRandomValues(new Uint8Array(SALT_LENGTH))
    : new Uint8Array(SALT_LENGTH).map(() => Math.floor(Math.random() * 256));
  const nonce = (typeof crypto !== 'undefined' && crypto.getRandomValues)
    ? crypto.getRandomValues(new Uint8Array(NONCE_LENGTH))
    : new Uint8Array(NONCE_LENGTH).map(() => Math.floor(Math.random() * 256));

  if (typeof crypto !== 'undefined' && crypto.subtle) {
    try {
      const key = await deriveAESKey(password, salt);
      if (key instanceof CryptoKey) {
        const encryptedBuffer = await crypto.subtle.encrypt(
          { name: 'AES-GCM', iv: nonce as BufferSource, tagLength: 128 },
          key,
          plaintext as BufferSource
        );
        return {
          ciphertext: new Uint8Array(encryptedBuffer),
          salt,
          nonce,
        };
      }
    } catch {
      // Fallback
    }
  }

  const keyBytes = fastPbkdf2Sha256(password, salt, PBKDF2_ITERATIONS, 32);
  const ciphertext = encryptGCM(keyBytes, nonce, plaintext);
  return {
    ciphertext,
    salt,
    nonce,
  };
}

export async function decryptPayload(
  ciphertext: Uint8Array,
  password: string,
  salt: Uint8Array,
  nonce: Uint8Array
): Promise<Uint8Array> {
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    try {
      const key = await deriveAESKey(password, salt);
      if (key instanceof CryptoKey) {
        const decryptedBuffer = await crypto.subtle.decrypt(
          { name: 'AES-GCM', iv: nonce as BufferSource, tagLength: 128 },
          key,
          ciphertext as BufferSource
        );
        return new Uint8Array(decryptedBuffer);
      }
    } catch (err: any) {
      if (err.name === 'OperationError' || err.message?.includes('operation failed')) {
        throw new Error('Incorrect password. Unable to decrypt this message.');
      }
    }
  }

  try {
    const keyBytes = fastPbkdf2Sha256(password, salt, PBKDF2_ITERATIONS, 32);
    return decryptGCM(keyBytes, nonce, ciphertext);
  } catch {
    throw new Error('Incorrect password. Unable to decrypt this message.');
  }
}

export function evaluatePasswordStrength(password: string): {
  score: number;
  label: string;
  color: string;
  entropyBits: number;
} {
  if (!password) return { score: 0, label: 'None', color: '#64748b', entropyBits: 0 };
  let pool = 0;
  if (/[a-z]/.test(password)) pool += 26;
  if (/[A-Z]/.test(password)) pool += 26;
  if (/[0-9]/.test(password)) pool += 10;
  if (/[^a-zA-Z0-9]/.test(password)) pool += 32;
  const entropyBits = Math.round(password.length * Math.log2(Math.max(pool, 2)));

  if (entropyBits < 36) return { score: 1, label: 'Weak', color: '#ef4444', entropyBits };
  if (entropyBits < 60) return { score: 2, label: 'Fair', color: '#f59e0b', entropyBits };
  if (entropyBits < 85) return { score: 3, label: 'Strong', color: '#10b981', entropyBits };
  return { score: 4, label: 'Vault-Grade', color: '#00ff88', entropyBits };
}
