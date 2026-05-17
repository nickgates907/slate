# Slate

Simple, clean screen recorder built for streamers.

---

## Getting started on Windows

### Step 1 — Install the tools (one time only)

1. **Node.js** — https://nodejs.org (download the LTS version, run the installer)
2. **Rust** — https://rustup.rs (download and run rustup-init.exe, accept all defaults)
3. **VS Build Tools** — Tauri needs this on Windows:
   - Go to https://visualstudio.microsoft.com/visual-cpp-build-tools/
   - Run the installer, check "Desktop development with C++" and install

After installing, **restart your terminal** before continuing.

---

### Step 2 — Install Tauri CLI

Open a terminal (PowerShell or Command Prompt) and run:

```
npm install -g @tauri-apps/cli
```

---

### Step 3 — Install project dependencies

Navigate to the Slate folder and run:

```
cd C:\Slate
npm install
```

---

### Step 4 — Run in development mode

```
npm run tauri dev
```

This will open Slate as a real desktop window. Any changes you make to the code will hot-reload instantly.

---

### Step 5 — Build a distributable installer (when ready)

```
npm run tauri build
```

This produces a Windows installer (.msi) in `src-tauri/target/release/bundle/`.

---

## Project structure

```
slate/
├── src/                    # React UI (TypeScript)
│   ├── App.tsx             # Root — wires everything together
│   ├── store.ts            # Scene/source types + save/load
│   ├── index.css           # Tailwind base styles
│   ├── main.tsx            # React entry point
│   └── components/
│       ├── Titlebar.tsx    # Logo, dark mode, record button
│       ├── Sidebar.tsx     # Scene switcher + delete scene
│       ├── Canvas.tsx      # Live preview + draggable sources
│       ├── SourcesPanel.tsx # Sources list + add/remove source
│       └── VideoTile.tsx   # Live camera/screen feed tile (Phase 2)
├── src-tauri/              # Rust backend (Tauri)
│   ├── src/main.rs         # list_capture_sources command (monitor enumeration)
│   ├── Cargo.toml          # Rust dependencies (tauri, screenshots)
│   ├── build.rs            # Build script
│   └── tauri.conf.json     # Window size, permissions, bundle config
├── package.json
├── vite.config.ts
├── tailwind.config.js
└── tsconfig.json
```

---

## Phase 1 — complete

- Full app UI — titlebar, sidebar, canvas, sources panel
- Scene switching — click any scene in the sidebar
- Add / remove scenes and sources per scene
- Show / hide sources with the eye icon
- Drag sources around the canvas preview
- Dark mode toggle
- Auto-saves layout to local storage

---

## Phase 2 — in progress

### Done

- Live webcam feed in canvas via `getUserMedia` — starts automatically when you add a camera source
- Virtual avatar camera support — detects VTube Studio, Animaze, and any virtual cam that appears as a video device
- Screen capture via `getDisplayMedia` — click "Select screen" on a screen source tile to pick a monitor or window
- Camera device enumeration — automatically targets the first available camera by device ID
- Rust `list_capture_sources` command — enumerates connected monitors via the `screenshots` crate (scaffolded, not yet wired to UI)
- Source name labels on every tile

### Still to do

- **Audio capture** — mic and desktop audio with live level meters
- **Camera picker UI** — choose between multiple cameras when more than one is connected
- **Native screen/window picker** — wire `list_capture_sources` to the UI so users pick a specific monitor or app window instead of the OS `getDisplayMedia` dialog
- **Record to file** — encode the composed output and save as `.mp4` / `.mkv`

---

## Phase 3 — planned

- Streaming output (RTMP — Twitch, YouTube)
- Output format and quality settings (resolution, FPS, bitrate, codec)
- Import overlays (drag-and-drop `.png` / `.svg` / `.zip` bundles)
- Cloud sync for `.slate` scene files

---

## Scene file format (.slate)

Layouts are saved as plain JSON. Example:

```json
{
  "version": "1.0",
  "activeSceneId": "scene-1",
  "scenes": [
    {
      "id": "scene-1",
      "name": "Game capture",
      "sources": [
        {
          "id": "src-1",
          "type": "camera",
          "name": "Webcam",
          "visible": true,
          "x": 20,
          "y": 20,
          "width": 280,
          "height": 158
        }
      ]
    }
  ]
}
```
