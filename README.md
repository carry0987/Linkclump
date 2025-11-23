# Linkclump

![build](https://github.com/carry0987/Linkclump/actions/workflows/build.yml/badge.svg)
![CI](https://github.com/carry0987/Linkclump/actions/workflows/ci.yml/badge.svg)

**Linkclump** is a powerful Chrome extension that lets you **open**, **copy**, or **bookmark multiple links at once** by drawing a selection box around them. Built with modern web technologies and fully compatible with **Manifest V3**.

---

## ✨ Features

* **🖱️ Multi-Link Selection** — Draw a selection box with mouse + keyboard to select multiple links
* **🎯 Flexible Actions** — Open in tabs, new window, copy URLs, or create bookmarks
* **⚙️ Customizable Shortcuts** — Configure mouse button + modifier key combinations
* **🎨 Visual Feedback** — Color-coded selection boxes for different actions
* **🔧 Advanced Options** — Smart selection, link filtering, tab positioning, delays, and more
* **🚫 Site Blocking** — Define URL patterns to disable Linkclump on specific sites
* **💾 Sync Settings** — Your configurations sync across Chrome instances

---

## 🧰 Prerequisites

* [Node.js](https://nodejs.org/) (LTS or Current)
* [pnpm](https://pnpm.io/) — Recommended package manager

---

## 🏗️ Tech Stack

* **TypeScript (ESNext)** — Strong typing & modern syntax
* **RSBuild** — High-performance bundler optimized for web extensions
* **TailwindCSS v4** — Utility-first CSS framework
* **Preact** — Lightweight React-compatible UI framework
* **Vitest** — Fast unit testing powered by Vite
* **Chrome Extension Manifest V3** — Modern extension architecture

---

## 🎯 How It Works

### 1. **Link Selection**

* Hold a **modifier key** (Shift/Ctrl/Alt) or use configured key
* Click and drag with **configured mouse button** (left/middle/right)
* A colored selection box appears around selected links
* Release to trigger the configured action

### 2. **Available Actions**

* **Open in Tabs** — Open all selected links in new tabs
* **Open in Window** — Open links in a new window
* **Copy to Clipboard** — Copy URLs in various formats (plain, markdown, HTML, etc.)
* **Create Bookmarks** — Add all links to a new bookmark folder

### 3. **Configuration Options**

Each action can be customized with:
* **Mouse button**: Left (0), Middle (1), or Right (2)
* **Modifier key**: Shift, Ctrl, Alt, A-Z, or None
* **Selection color**: Visual indicator for different actions
* **Advanced options**:
  * Smart selection mode
  * Link filtering (include/exclude patterns)
  * Tab delay and positioning
  * Auto-close source tab
  * Block duplicate URLs
  * Reverse link order

---

## 🚀 Quick Start

### Installation

```bash
# Install dependencies
pnpm install
```

### Development

```bash
# Start development mode with watch
pnpm run dev
```

1. Open **chrome://extensions/** in Chrome
2. Enable **Developer mode**
3. Click **Load unpacked**
4. Select the **`dist/`** directory
5. Make changes — the extension rebuilds automatically

### Testing

```bash
# Run unit tests
pnpm run test

# Run tests in watch mode
pnpm run test:watch

# Generate coverage report
pnpm run test:cov
```

### Production Build

```bash
# Build for production
pnpm run build:prod
```

The optimized extension will be output to the `dist/` folder.

---

## 🔧 Configuration

### Settings Page

1. Click the extension icon or right-click and select **Options**
2. Configure actions with different mouse + key combinations:
   * Choose mouse button (Left/Middle/Right)
   * Select modifier key or letter key
   * Pick action type (Tabs/Window/Copy/Bookmark)
   * Set color for visual feedback
   * Configure advanced options per action
3. Add blocked site patterns (regex supported)
4. Click **Save Settings**

### Default Configuration

By default, **Left Click + Z** key opens links in new tabs.

### Message Flow

```
Content Script (user draws selection)
    ↓ MSG.LINKCLUMP_ACTIVATE
Background Worker (processes action)
    ↓ chrome.tabs.create / chrome.bookmarks / etc.
Action Executed
```

---

## 🔒 Permissions

* **storage** — Save user settings and sync across devices
* **bookmarks** — Create bookmark folders
* **clipboardWrite** — Copy links to clipboard
* **host_permissions: `<all_urls>`** — Inject content script on all sites

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📜 License

[MIT](LICENSE) © 2025 carry0987

---

## 🙏 Acknowledgments

Inspired by the original Linkclump extension, rebuilt from scratch with modern tooling and architecture.
