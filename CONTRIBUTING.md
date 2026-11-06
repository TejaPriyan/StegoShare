# Contributing to STEGOSHARE

Thank you for your interest in contributing to STEGOSHARE! We welcome code contributions, documentation improvements, issue reports, and feature suggestions.

---

## Code of Conduct
Please read and follow our [Code of Conduct](CODE_OF_CONDUCT.md) in all project interactions.

---

## Development Workflow

### 1. Prerequisites
- Node.js `>= 18.0.0`
- `npm` or `pnpm`

### 2. Setup
```bash
git clone https://github.com/vasanthi/stegoshare.git
cd stegoshare
npm install
```

### 3. Running Locally
```bash
# Start Vite development server
npm run dev

# Run automated test suite
npm test

# Typecheck and build production bundle
npm run build
```

---

## Pull Request Guidelines
1. Create a feature branch from `main`: `git checkout -b feature/my-new-feature`.
2. Follow TypeScript strict typing — do not introduce untyped `any` or disable type checking.
3. Ensure all tests pass (`npm test`) and the project builds without errors (`npm run build`).
4. Commit with descriptive messages.
5. Submit a Pull Request targeting the `main` branch.
