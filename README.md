# Chrome Extension Starter

![build](https://github.com/carry0987/Chrome-Extension-Starter/actions/workflows/build.yml/badge.svg)
![CI](https://github.com/carry0987/Chrome-Extension-Starter/actions/workflows/ci.yml/badge.svg)

A modern **Chrome Extension Starter Template** built with **TypeScript**, **Preact**, **TailwindCSS**, **RSBuild**, and **Vitest** — fully compatible with **Manifest V3**.
Designed for fast development, clean architecture, and strongly typed communication between extension modules.

---

## 🧰 Prerequisites

* [Node.js](https://nodejs.org/) (LTS or Current)
* [pnpm](https://pnpm.io/) — Recommended package manager

---

## 🧩 Includes the Following

### 🏗️ Core Stack

* **TypeScript (ESNext)** — Strong typing & modern syntax
* **RSBuild** — High-performance bundler optimized for modern web extensions
* **TailwindCSS v4** — Utility-first CSS framework for responsive design
* **Preact** — Lightweight React-compatible UI framework
* **Vitest** — Fast unit testing powered by Vite

---

### ⚙️ Extension Architecture

* **Background (Service Worker)**

  * Lifecycle control (`onInstalled`, `onStartup`)
  * Enforces tab-level action policies
  * Centralized event and permission management

* **Content Scripts**

  * Injected into web pages for DOM manipulation and UI overlays
  * Listens for typed messages from popup or background

* **Popup & Options Pages**

  * Built with Preact + Tailwind
  * Share logic and style via the `shared/` module

* **Shared Library (`src/shared/lib`)**

  * `messaging.ts` → Unified **typed message bus** with async support and auto-cleanup
  * `storage.ts` → **Typed Chrome Storage API** supporting `local`, `sync`, `managed`, and `session`
  * `logger.ts` → Lightweight structured logger
  * `dom.ts` → Safe DOM mounting helpers

* **Constants & Types**

  * `constants.ts` → Global flags, restricted URL definitions, message enums
  * `types.d.ts` → Shared type definitions for storage schema and messaging

* **Tests (`__tests__/`)**

  * `messaging.test.ts` → Verifies async message bridge logic
  * Example tests for storage utilities

---

### 🧠 Example Implementations

* **🔗 Typed Messaging System (`messaging.ts`)**
  Provides a unified API for cross-context communication:

  ```ts
  // popup/background → content
  await bus.sendToActive(MSG.CHANGE_BG, { color: '#0ea5e9' });

  // content → listener
  const off = bus.on(MSG.CHANGE_BG, (payload) => {
    document.body.style.backgroundColor = payload.color;
    return { ok: true };
  });
  ```

  * `bus.sendToActive` / `bus.sendToTab`: Type-safe messaging with timeout support
  * `bus.on`: Strongly typed listener with automatic cleanup

* **💾 Typed Chrome Storage (`storage.ts`)**
  Generic, schema-driven access layer:

  ```ts
  import { kv } from '@/shared/lib/storage';

  // Set and get typed values
  await kv.set('sync', 'theme', 'dark');
  const theme = await kv.get('sync', 'theme', 'system');

  // Managed storage (read-only)
  const orgPolicy = await kv.get('managed', 'orgEnabled', false);
  ```

* **🧩 Overlay Demo (Content Script)**

  * Listens to `CHANGE_BG`
  * Dynamically updates page background
  * Displays a Preact-based notification overlay

---

## 📁 Project Structure

```
src/
├── background/      # Background service worker logic
│   ├── alarms.ts    # Optional periodic jobs
│   ├── index.ts     # Main background entry
│   └── runtime.ts   # Lifecycle + tab action policies
├── content/         # Scripts injected into web pages
│   ├── index.tsx    # Overlay UI (Preact)
│   └── bridge.ts    # Messaging bridge
├── pages/           # Extension UIs (Popup & Options)
│   ├── popup/
│   │   └── index.tsx
│   └── options/
│       └── index.tsx
└── shared/          # Common logic and utilities
    ├── lib/
    │   ├── messaging.ts   # Typed messaging system
    │   ├── storage.ts     # Typed Chrome storage API
    │   ├── logger.ts      # Console wrapper
    │   └── dom.ts         # DOM helpers
    ├── constants.ts       # Flags & restricted schemes
    ├── types.d.ts         # Shared type declarations
    └── styles.css         # Tailwind entrypoint
```

---

## ⚡ Setup

```bash
pnpm install
```

---

## 🧑‍💻 Development Mode (Watch + Hot Reload)

```bash
pnpm run dev
```

* RSBuild will watch file changes and rebuild incrementally.
* Open `chrome://extensions/` → Enable **Developer Mode** → Load `dist/`
* Every rebuild automatically updates your extension when reloaded.

> Tip: Use `chrome.runtime.reload()` or click “Reload” in the Extensions page after each build.

---

## 🧪 Run Unit Tests (Vitest)

```bash
# Run tests once
pnpm run test

# Run tests in watch mode
pnpm run test:watch

# Generate coverage report
pnpm run test:cov
```

---

## 🚀 Build for Production

```bash
pnpm run build
```

Outputs optimized files to the `dist/` folder, ready for packaging or loading into Chrome.

---

## 🧭 Load Extension into Chrome

1. Run the build command:

   ```bash
   pnpm run build
   ```
2. Open **chrome://extensions/**
3. Enable **Developer mode**
4. Click **Load unpacked**
5. Select the generated **`dist/`** directory

---

## 📜 License

[MIT](LICENSE) © 2025 carry0987
