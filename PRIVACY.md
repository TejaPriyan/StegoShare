# Privacy Policy — STEGOSHARE

**Last Updated:** November 2026

STEGOSHARE is built from the ground up on a **Zero-Knowledge, Client-Side Only** architecture. Your privacy and secrecy are mathematically guaranteed by the architecture of the application.

---

## 1. Zero Data Collection
- **No Server Processing**: STEGOSHARE does not operate an application backend for processing files or images. All steganographic embedding, pixel decoding, and cryptographic operations happen entirely inside your web browser’s local sandbox using the HTML5 Canvas API and the Web Crypto API (`window.crypto.subtle`).
- **No Telemetry or Analytics**: There are no tracking scripts, Google Analytics, telemetry beacons, session recorders, or advertising pixels embedded in the codebase.
- **No Cookies or Local Identifiers**: The application does not set cookies, session tokens, or persistent cross-site tracking IDs.
- **No Account Required**: STEGOSHARE requires no registration, email address, password submission, or personal identification.

## 2. In-Memory Operation & State Purging
- When you upload a carrier image or type a secret message, the data resides strictly in volatile browser RAM (`Uint8ClampedArray` / `Uint8Array`).
- Clicking the **"Purge Memory"** button or refreshing the browser tab immediately discards all images, messages, derived keys, and canvas buffers from volatile memory.
- No payload data is written to `localStorage`, `sessionStorage`, or `IndexedDB`.

## 3. Cryptographic Security Standards
- Passwords are never sent across any network.
- Keys are derived locally using `PBKDF2` with `HMAC-SHA-256` and `100,000` iterations, employing a cryptographically secure random `16-byte` salt per operation.
- Encryption uses `AES-256-GCM` with a unique `12-byte` IV/nonce and an authenticating `128-bit` tag.

## 4. Third-Party CDNs
- The standalone version uses standard font assets via Google Fonts and Tailwind CSS styling. No user data, file bytes, or payload content is ever transmitted to these CDNs.
- For maximum security and air-gapped environments, STEGOSHARE can be run completely offline via `npm run build` and `npm run preview`.

## 5. Open Source Verification
The entire codebase is free and open-source under the MIT License. Anyone can independently inspect, audit, build, and verify the cryptographic integrity of the application:
[https://github.com/vasanthi/stegoshare](https://github.com/vasanthi/stegoshare)

---
*For security inquiries, please consult [SECURITY.md](SECURITY.md).*
