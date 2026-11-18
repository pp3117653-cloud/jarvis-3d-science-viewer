# Jarvis — 3D science viewer

Interactive 3D science viewer controlled by hand gestures, voice commands, or keyboard and mouse. Designed for desktop screens and 4-sided acrylic hologram pyramids.

## Setup & Offline Usage

1. Install dependencies:
   ```bash
   npm install
   ```
2. Run once while online so `scripts/fetch-assets.mjs` copies the MediaPipe WASM bundle and downloads `hand_landmarker.task` into `public/`:
   ```bash
   npm run dev
   ```
3. After the first online startup, the app runs completely offline.

## Keyboard Shortcuts

- `1` – `5`: Switch models (1: Earth, 2: Solar system, 3: Heart, 4: DNA, 5: Atom)
- `Arrow keys` / Mouse drag: Rotate model (`Shift + drag` to pan)
- `+` / `-` or Scroll wheel: Zoom in / out
- `E`: Toggle explode view
- `R`: Reset view to default
- `M`: Toggle hologram pyramid mode (`[` and `]` adjust pyramid size, `Esc` exits)
- `H`: Toggle camera preview
- `S`: Mute / unmute sound
- `V`: Push-to-talk voice command
- `F`: Toggle fullscreen
- `,`: Open settings drawer
- `?` or `T`: Open help & gesture guide
