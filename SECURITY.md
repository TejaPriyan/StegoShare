# Security Policy — STEGOSHARE

## 1. Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |

---

## 2. Cryptographic Specifications

STEGOSHARE adheres to modern, peer-reviewed cryptographic standards:

- **Key Derivation**: `PBKDF2` with `HMAC-SHA-256`, `100,000` rounds, and `16-byte` (128-bit) cryptographically random salt per operation.
- **Symmetric Encryption**: `AES-256-GCM` (NIST SP 800-38D) with a unique `12-byte` (96-bit) IV/nonce per operation.
- **Authentication**: `128-bit` (16-byte) GCM authentication tag verifying ciphertext authenticity.
- **Integrity**: `CRC32` (IEEE 802.3) payload checksum verifying bit-identical pixel recovery.
- **Entropy Source**: Cryptographically secure pseudorandom numbers sourced exclusively via `window.crypto.getRandomValues()`.

---

## 3. Threat Model & Safeguards

- **Pixel Tampering Detection**: Alterations to image pixels trigger CRC32 validation errors, preventing presentation of corrupted or maliciously modified payloads.
- **Wrong Password Defense**: Authenticated decryption validates the GCM authentication tag before decoding bytes. Invalid passwords fail securely without leaking ciphertext characteristics.
- **Side-Channel Isolation**: Execution runs in client browser memory without transmitting plaintext, ciphertext, or keys over any network.

---

## 4. Reporting a Vulnerability

If you discover a security vulnerability in STEGOSHARE, please report it responsibly:

1. **Email**: Open an advisory or contact the security team via GitHub Security Advisories.
2. **Details to Provide**:
   - Description of the vulnerability.
   - Proof-of-concept steps or sample carrier image.
   - Affected browser(s) and operating system(s).
3. **Response Window**: Security reports are acknowledged within 48 hours, with updates provided as the issue is triaged and resolved.
