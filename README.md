# STEGOSHARE 🛡️
### Advanced Two-Way Browser-Only Cryptographic Steganography Platform

<p align="center">
  <a href="https://github.com/vasanthi/stegoshare/actions/workflows/ci.yml">
    <img src="https://img.shields.io/badge/CI-Passing-00FF88?style=for-the-badge&logo=github-actions&logoColor=black" alt="CI Status" />
  </a>
  <a href="./LICENSE">
    <img src="https://img.shields.io/badge/License-MIT-00E5FF?style=for-the-badge" alt="License: MIT" />
  </a>
  <a href="https://vitest.dev">
    <img src="https://img.shields.io/badge/Vitest-10%2F10%20Tests%20Passing-00FF88?style=for-the-badge&logo=vitest&logoColor=black" alt="Vitest Tests" />
  </a>
  <a href="https://www.typescriptlang.org/">
    <img src="https://img.shields.io/badge/TypeScript-5.4%2B%20Strict-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  </a>
  <a href="https://vitejs.dev/">
    <img src="https://img.shields.io/badge/Vite-5.4-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" />
  </a>
  <a href="https://buymeacoffee.com/stegoshare">
    <img src="https://img.shields.io/badge/Buy%20Me%20A%20Coffee-Support-FFDD00?style=for-the-badge&logo=buy-me-a-coffee&logoColor=black" alt="Buy Me A Coffee" />
  </a>
</p>

<p align="center">
  <strong>"Hide Your Message. Reveal the Invisible."</strong><br>
  100% Client-Side • Zero-Knowledge Architecture • Authenticated AES-256-GCM • IEEE 802.3 CRC32 • 1-LSB RGBA Spatial Encoding
</p>

---

## ☕ Support STEGOSHARE

STEGOSHARE is open-source, zero-knowledge, free software built to guarantee private communications without tracking or remote servers. If this project helps protect your privacy or supports your security research, please consider supporting ongoing maintenance!

<p align="center">
  <a href="https://buymeacoffee.com/stegoshare" target="_blank" rel="noopener noreferrer">
    <img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee" width="220" />
  </a>
</p>

---

## 🌟 Key Features

1. **Two-Way Zero-Knowledge Workflow**:
   - **Sender (Hide Message)**: Upload any carrier image (`PNG`, `JPG`, `JPEG`, `BMP`, `WEBP`), compose secret UTF-8 text or attach arbitrary binary files (`.txt`, `.pdf`, `.zip`, `.bin`), optionally lock with `AES-256-GCM`, preview visual and statistical image metrics (`PSNR`, `SSIM`, 50x Amplified Diff Map, Side-by-Side Zoom), and export a lossless `.png` carrier.
   - **Receiver (Reveal Message)**: Upload a stego `.png` image, parse the structured binary packet (`STEGOSHARE` magic header, flags, lengths, checksums), enter the decryption password if protected, and extract original text or binary files with SHA-authenticated integrity.
2. **True Least Significant Bit (1-LSB) Matrix**:
   - Modifies only the least significant bit (LSB) of Red, Green, and Blue pixel channels (3 bits per pixel).
   - **Alpha Channel Untouched**: Alpha values are preserved strictly at their original values to prevent visual translucency artifacts or color distortions.
   - Imperceptible modification: Peak Signal-to-Noise Ratio (PSNR) $> 51\text{ dB}$, Structural Similarity Index (SSIM) $> 0.999$.
3. **Enterprise Authenticated Cryptography**:
   - Key Derivation: `PBKDF2-HMAC-SHA-256` with `100,000` iterations and a 16-byte random salt.
   - Encryption: Authenticated `AES-256-GCM` with a 12-byte random nonce and 128-bit authentication tag.
   - Pure-JS Cryptographic Engine fallback for sandboxed environments or legacy runtimes.
4. **IEEE 802.3 CRC32 Tamper Detection**:
   - 32-bit cyclical redundancy check protects against corrupted pixels, compression artifacts, and payload truncation.
5. **Zero Server Footprint & Strict Privacy**:
   - Zero telemetry, zero analytics, zero external cookies, and zero remote API calls. All calculations execute exclusively in the browser's JavaScript sandbox.
6. **Built-in 10-Test Automated Verification Suite**:
   - Automated in-browser test runner and Vitest suite verifying CRC32 vectors, 1-LSB roundtrips, Alpha channel preservation, AES-256-GCM roundtrips, bad password rejections, tamper detection, binary file handling, capacity limits, entropy rating, and quality metrics.

---

## 📦 Binary Payload Format Specification (Version 1)

Every STEGOSHARE packet embedded into pixel bits follows this deterministic binary layout:

| Offset (Bytes) | Field Name | Type / Length | Description |
|:---|:---|:---|:---|
| `0..9` | **Magic Signature** | ASCII String (`10 B`) | Constant ASCII `"STEGOSHARE"` |
| `10` | **Format Version** | `Uint8` (`1 B`) | Version identifier (Current: `0x01`) |
| `11` | **Flags** | `Uint8` (`1 B`) | Bit 0: Encrypted (`0x01`), Bit 1: Binary File (`0x02`) |
| `12` | **Salt Length** ($S$) | `Uint8` (`1 B`) | `16` bytes if encrypted, `0` if unencrypted |
| `13..(13+S)` | **PBKDF2 Salt** | Bytes ($S$ bytes) | Cryptographically secure random 16-byte salt |
| Next `1 B` | **Nonce Length** ($N$) | `Uint8` (`1 B`) | `12` bytes if encrypted, `0` if unencrypted |
| Next $N\text{ B}$ | **AES-GCM Nonce** | Bytes ($N$ bytes) | Cryptographically secure random 12-byte IV |
| Next `2 B` | **Metadata Length** ($M$) | `Uint16` Big-Endian | Byte length of UTF-8 JSON metadata string |
| Next $M\text{ B}$ | **JSON Metadata** | UTF-8 String ($M$ bytes)| Object with `mode`, `filename`, `mimeType`, `timestamp` |
| Next `4 B` | **Payload Length** ($P$) | `Uint32` Big-Endian | Byte length of raw/ciphertext payload |
| Next `4 B` | **CRC32 Checksum** | `Uint32` Big-Endian | IEEE 802.3 CRC32 of payload bytes |
| Next $P\text{ B}$ | **Payload Data** | Bytes ($P$ bytes) | UTF-8 Plaintext or AES-256-GCM Ciphertext |

---

## 🚀 Quick Start & Development

### System Requirements
- Node.js `>= 18.0.0`
- npm, pnpm, or yarn

### Installation
```bash
# Clone the repository
git clone https://github.com/vasanthi/stegoshare.git
cd stegoshare

# Install dependencies
npm install
```

### Running Locally
```bash
# Start local Vite development server
npm run dev

# Run full Vitest automated test suite (10 tests)
npm test

# Build production bundle with strict TypeScript validation
npm run build

# Preview production build locally
npm run preview
```

---

## 🧪 Automated Test Verification

STEGOSHARE maintains 100% passing automated test coverage across all cryptographic and steganographic routines:

```
 RUN  v1.6.1 C:/Users/vasanthi/Downloads/stegoshare-fixed

 ✓ src/tests/stego.test.ts (10 tests)
   ✓ 1. computes CRC32 IEEE 802.3 standard test vector
   ✓ 2. embeds and extracts 1-LSB plaintext correctly
   ✓ 3. strictly preserves the Alpha channel during 1-LSB embedding
   ✓ 4. encrypts and decrypts payloads via AES-256-GCM + PBKDF2
   ✓ 5. rejects AES-256-GCM decryption when given an invalid password
   ✓ 6. detects tampered payload via CRC32 integrity check
   ✓ 7. serializes and decodes arbitrary binary file payloads
   ✓ 8. calculates carrier capacity accurately and warns on overflow
   ✓ 9. evaluates password strength and entropy correctly
   ✓ 10. calculates PSNR and SSIM quality metrics showing imperceptible deviation

 Test Files  1 passed (1)
      Tests  10 passed (10)
```

---

## 🌐 SEO, GEO & AEO Optimization

STEGOSHARE is fully optimized for standard search engines (SEO), Generative Engine Optimization (GEO), and Answer Engine Optimization (AEO):

- **Structured Data (`JSON-LD`)**: Rich schemas for `WebApplication`, `HowTo`, and `FAQPage` enabling Google and Bing rich results.
- **AI & LLM Crawlers**: Directives in `robots.txt` and `public/robots.txt` explicitly welcoming `GPTBot`, `ClaudeBot`, `PerplexityBot`, and `Applebot-Extended`.
- **LLM Context Files**:
  - `llms.txt`: Standard LLM-readable summary of repository capabilities and architecture.
  - `llms-full.txt`: In-depth specification covering mathematical models, packet layouts, and cryptographic guarantees.
- **Web App Manifest**: Full Progressive Web App (PWA) configuration in `site.webmanifest`.
- **OpenGraph & Twitter Cards**: High-resolution social previews with complete metadata.

---

## 🔒 Security & Privacy Policy

- **Zero-Knowledge Architecture**: Encryption and decryption happen exclusively in client RAM via the standard Web Crypto API (`window.crypto.subtle`).
- **No Persistence of Keys**: Passwords and derived cryptographic keys are held only in local memory variables and never persisted to `localStorage`, `sessionStorage`, or cookies.
- **Lossless Carrier Advisory**: 1-LSB steganography requires lossless file transmission (`PNG`, `BMP`). Lossy messaging compression (e.g. WhatsApp standard image sharing) alters pixel values and corrupts 1-LSB data. To transmit securely over messaging apps, send the file as an **uncompressed Document**.
- Detailed security guidelines are documented in [SECURITY.md](./SECURITY.md) and [PRIVACY.md](./PRIVACY.md).

---

## 📂 Repository Structure

```text
├── .github/
│   ├── workflows/ci.yml           # Multi-version Node.js CI Matrix (18, 20, 22)
│   ├── ISSUE_TEMPLATE/            # Bug report & feature request templates
│   └── PULL_REQUEST_TEMPLATE.md   # Standard pull request checklist
├── public/                        # Production static assets (manifest, robots, sitemap, llms)
├── src/
│   ├── components/                # React UI components (Navbar, Hero, CapacityMeter, etc.)
│   ├── engine/                    # Modular stego & crypto engine
│   │   ├── capacityCalculator.ts  # Carrier byte capacity calculator
│   │   ├── cryptoEngine.ts        # AES-256-GCM + PBKDF2 Web Crypto with pure-JS fallback
│   │   ├── imageProcessor.ts      # PSNR, SSIM, and amplified pixel difference map
│   │   ├── imageValidator.ts      # File size and MIME type guards
│   │   ├── payloadParser.ts       # Binary packet deserializer & CRC32 validator
│   │   ├── payloadSerializer.ts   # STEGOSHARE v1 binary serializer
│   │   ├── stegoDecoder.ts        # 1-LSB spatial bit extractor
│   │   └── stegoEncoder.ts        # 1-LSB spatial bit embedder
│   ├── hooks/                     # Custom React session hooks
│   ├── tests/                     # Vitest comprehensive verification suite
│   ├── types/                     # TypeScript data contracts
│   ├── utils/                     # CRC32 calculation utilities
│   ├── App.tsx                    # Primary React application container
│   └── main.tsx                   # React root entry point
├── CODE_OF_CONDUCT.md             # Contributor Covenant v2.1
├── CONTRIBUTING.md                # Development & contribution guidelines
├── LICENSE                        # MIT License
├── PRIVACY.md                     # Zero-Knowledge Privacy Policy
├── README.md                      # Complete project documentation
├── SECURITY.md                    # Cryptographic security policy
├── TERMS.md                       # Terms of Service & Lossless Carrier Advisory
├── index.html                     # Standalone zero-dependency production app
├── llms.txt                       # Generative Engine Optimization (GEO) spec
├── llms-full.txt                  # Full technical specification for AI crawlers
├── robots.txt                     # SEO & AI bot directives
└── sitemap.xml                    # Complete XML sitemap
```

---

## 📄 License & Terms

STEGOSHARE is licensed under the permissive **[MIT License](./LICENSE)**.  
Review the [Terms of Service](./TERMS.md) and [Privacy Policy](./PRIVACY.md) for usage conditions and legal notices.
