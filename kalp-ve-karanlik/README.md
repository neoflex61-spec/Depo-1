# Kalp ve Karanlık — "Aşkın Cenazesi" (Prototype)

A lightweight, self-contained browser animation prototype for the Gothic Toon
series **Kalp ve Karanlık**. Pure HTML + CSS + SVG + vanilla JavaScript —
no Node.js, no build step, no GPU requirement, no paid APIs, no model
downloads, nothing to install. It runs the moment you open `index.html` in
any modern mobile browser.

## Files

- `index.html` — page structure, the inline SVG scene (background + both
  characters + the skeleton butler), subtitle/title-card markup, controls.
- `style.css` — all visuals: layout, the 9:16 responsive stage, every
  animation (blinking, candle flicker, fog drift, dust motes, bat flight,
  lip-flap, jaw movement, idle sway, character entrances/poses).
- `script.js` — the timeline engine (play/pause/restart/mute), the
  10-second scripted sequence, and a small generative Web Audio soundscape
  (ambient drone + wind + a few sound cues) synthesized entirely in code —
  no audio files.
- `README.md` — this file.

Nothing references an external server, font, or asset. The whole thing is
three files you can zip up and carry anywhere.

## What's in the scene

- **Stage**: a 9:16 vertical canvas (CSS `aspect-ratio`) that scales to fit
  the viewport width *and* height, so it fits an Android screen in portrait
  or landscape without ever scrolling.
- **Background**: a hand-built SVG Gothic hall — a pointed arch window with
  a moon and flying bats, damask wallpaper (SVG `<pattern>`), an ancestor
  portrait with slowly blinking eyes, cobwebbed corners, two flickering
  candle sconces with a soft glow filter, and a floor.
- **Lucien** and **Morgana**: two consistent SVG characters (same markup
  reused throughout, only CSS classes change) with blinking eyes, swappable
  eyebrows/mouths for expressions, a lip-flap talk animation, idle body
  sway, and pose changes (Lucien's rose-offering arm rising in; Morgana
  shifting to a sassy one-hand-on-hip pose).
- **The skeleton butler**: slides in from a side doorway at second 8, with
  his own hinged-jaw talk animation and a tray tucked under one arm.
- **Atmosphere**: drifting layered fog, ~16 floating dust motes (generated
  once in JS, animated in pure CSS), candlelight flicker, a cool color
  grade from the SVG gradients.
- **Subtitles**: a Turkish subtitle bar synced to the timeline.
- **Controls**: Oynat (Play), Duraklat (Pause), Baştan (Restart), Ses
  (Mute) — all 4 required controls, large touch targets.
- **The scripted 10 seconds**, exactly as specified:
  - 0–3s: Lucien kneels, the black rose rises into view.
  - 3–6s: *"Morgana, kalbim sonsuza kadar senin."*
  - 6–8s: *"Harika. Viktor'un düğününde de yanında getir."*
  - 8–10s: the skeleton butler enters: *"Kalbinizi tabuta mı koyalım
    efendim?"*
  - →10s+: title card, **AŞKIN CENAZESİ**, with a Replay button.

Pause truly freezes everything (every CSS animation on the stage is paused
via `animation-play-state`, and the JS clock stops), not just the dialogue
timer.

## How this was actually tested

I do not have a phone or a visual display in this session, so I could not
tap it by hand. What I *did* do, for real, in this cloud environment:

- Loaded `index.html` in **headless Chromium** (the same rendering engine
  Android Chrome uses) via Playwright and confirmed it loads with **zero
  JavaScript errors**.
- Drove the Play/Pause/Restart/Mute buttons programmatically and verified
  via the live DOM that: the subtitle text matches the script at each
  timestamp, the butler's `onstage` state flips at the right time, pausing
  genuinely freezes progress (subtitle doesn't advance while paused),
  resuming continues correctly, and restarting mid-scene cleanly resets
  every character back to its initial state.
- Took real rendered screenshots at multiple points in the sequence and at
  three phone-sized viewports (360×640, 390×844, 412×915) plus a landscape
  size (740×360), and visually reviewed them — this is how I caught and
  fixed two real rendering bugs along the way (see below).
- Confirmed there is no horizontal or vertical overflow at any of those
  sizes.

Two genuine bugs were found and fixed this way, not guessed at:

1. `className = "..."` throws on SVG elements (it's read-only there) —
   this broke the Restart button's internal reset. Fixed with
   `setAttribute("class", ...)`.
2. A CSS `transform` animation on an SVG element **completely replaces**
   that element's `transform="translate(...)"` attribute instead of
   combining with it — this made the black rose render at the wrong
   position (collapsed to the scene's origin) once its idle sway animation
   was added. Fixed by separating "where it sits" (an outer `<g>` with the
   positioning attribute) from "how it sways" (an inner `<g>` the CSS
   animates).

What I have **not** verified: real touch input on a physical phone, audible
sound output (I confirmed the Web Audio graph builds and runs without
throwing, but I have no speakers), and real-world mobile network/battery
behavior. No MP4 or video file has been produced — this is an interactive
browser animation, which was the stated goal.

## Previewing it on your Android phone

You don't need a terminal, Node.js, or any app beyond a browser.

**Option A — straight from your files app (fastest, fully offline):**
1. Get all three files (`index.html`, `style.css`, `script.js`) onto your
   phone, in the **same folder** together (e.g. in your Downloads folder).
2. Open your file manager app, navigate to that folder, and tap
   `index.html`.
3. Choose **Chrome** (or your default browser) to open it.
4. It will load instantly, fully offline — tap **Oynat** to play (audio
   needs that first tap, by browser design on every platform).

This works because `script.js` is loaded as a plain classic script (no
ES-module imports, no `fetch()` of local files), which Android Chrome
allows from a local `file://` page.

**Option B — if the files are in a GitHub repo:** open the repo in Chrome,
open `kalp-ve-karanlik/index.html`, tap "Raw", long-press the page and
"Download" or just view it (GitHub's raw HTML view won't execute the
script/CSS, so for a working preview you want Option A or Option C, not a
raw GitHub view).

## Publishing it as a real website

Two no-terminal ways to get a public URL, both doable entirely from a phone
browser:

**1. GitHub Pages (recommended since this project already lives in a
GitHub repo)**
- Push this `kalp-ve-karanlik/` folder to GitHub (ask me to do this from
  this session, or push it yourself).
- On github.com, open the repo → **Settings → Pages** → under "Build and
  deployment", set the source branch (and `/ (root)` folder) → Save.
- GitHub gives you a URL like
  `https://<username>.github.io/<repo>/kalp-ve-karanlik/`. That's your
  live, shareable site — static hosting, free, no server to manage.

**2. Netlify Drop (no account, no repo needed)**
- On your phone, go to `app.netlify.com/drop`.
- Select/upload the folder containing `index.html`, `style.css`,
  `script.js`.
- Netlify instantly gives you a live `https://...netlify.app` URL.
- (Creating a free account lets you keep/update that URL later; a drop
  without an account is temporary.)

Either way, because the project has zero build step and zero external
dependencies, "publishing" is purely "put these 3 files on any static file
host" — there is nothing to compile or configure.

## Extending the prototype

- Add more lines to the `TIMELINE` array in `script.js` — each entry is
  `{ t: seconds, run: () => { ...toggle classes, show subtitle... } }`.
- New expressions/poses follow the same pattern already used: add a mouth
  or eyebrow variant as a sibling SVG element with its own class, then add
  one CSS rule showing it (and hiding the others) under a new state class
  on the character's root `<g>`.
- The generative audio cues (`sfx("thud" | "chime" | "stinger" | "creak" |
  "bell")`) in `script.js` can be extended with new short synthesized
  sounds the same way, or replaced with real audio files later (an
  `<audio>` tag would need one user-gesture-gated `.play()` call, same
  constraint as the current Web Audio setup).
