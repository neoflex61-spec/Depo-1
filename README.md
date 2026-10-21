# THE LAST SOLITUDE

A cinematic animated short film about loneliness in a dark medieval Gothic
world, built entirely inside this Claude Code environment — no Blender,
no external rendering websites, no extra apps to install.

## Environment audit

This session's container has, pre-installed:

| Tool | Available | Used for |
|---|---|---|
| Node 22 + a global `playwright` package | yes | driving a real browser to record the 3D scene |
| Headless Chromium (pre-cached, software WebGL via SwiftShader) | yes | actually rendering the three.js scene, frame by frame |
| `ffmpeg` 6.1 | yes | encoding the captured video to a verified, playable MP4 |
| Python 3.13 + Pillow/numpy | yes | (available, not needed once the WebGL path worked) |
| Blender | no | — |
| A GPU | no | WebGL falls back to software rendering (slower, but correct) |
| Internet access to arbitrary CDNs (e.g. cdnjs) from *this container* | no, egress-restricted | worked around by installing `three.js` from the npm registry, which is allowlisted |

Conclusion: this environment **can** execute code, run a real-time WebGL 3D
renderer, and export a genuine MP4 — it just has to be done by driving an
actual browser rather than calling an external "renderer" service.

## How "The Silent Cathedral" was built

1. **`scenes/01_silent_cathedral/render/scene.html`** — a real-time,
   WebGL (three.js) Gothic cathedral nave: pointed-arch rib vaulting,
   fluted stone pillars, procedurally generated stained-glass windows and
   a rose window, a cold moonlight shaft, drifting dust, flickering
   candlelight, fog, and a solitary cloaked figure standing far down the
   nave. A 13-second eased camera dolly pushes down the nave toward the
   figure and the rose window. Camera, color grading (ACES tone mapping +
   a CSS vignette/grain/cool-wash overlay) and 16:9 framing were tuned by
   iterating on real screenshots, not guessed blind.
2. **`scenes/01_silent_cathedral/pipeline/record.js` + `build.sh`** —
   launches that exact scene in headless Chromium via Playwright,
   actually plays the real-time animation, records the literal rendered
   frames to video, then encodes to MP4 with `ffmpeg` and trims the short
   black/white browser-startup leader. This is real captured 3D
   rendering, not a slideshow of still images.
3. **`scenes/01_silent_cathedral/render/artifact.html`** (built from
   `render/src/artifact_template.html` + vendored `three.js` by
   `render/src/build_artifact.py`) — a phone-friendly, responsive,
   interactive version of the same scene, published as a Claude Artifact
   so it can be opened and replayed directly from a phone, no download or
   install required: **https://claude.ai/artifact/TS2sTSPbQbUXTqARusayz6**

### Verified deliverable

`scenes/01_silent_cathedral/output/silent_cathedral_preview.mp4` —
confirmed via `ffprobe` (see `ffprobe_report.txt` next to it) to be a real,
decodable H.264 file: 1280x720 (16:9), 25fps, 334 frames, 13.36s, and
spot-checked frame-by-frame (`ffmpeg` frame extraction + visual review) to
contain the actual rendered cathedral, not a placeholder.

## Regenerating

```
bash scenes/01_silent_cathedral/pipeline/build.sh
```

Re-records and re-encodes the preview from the live scene. Takes under a
minute on this machine. Edit `render/scene.html` (recording source) and
`render/src/artifact_template.html` (phone/Artifact version — keep the two
in sync) then re-run.

## Next steps toward a 3–5 minute film

The pipeline built here scales to a full short — the remaining work is
content, not tooling:

1. **More scenes.** Duplicate the `scenes/01_silent_cathedral/` pattern for
   each new location/beat (e.g. `02_the_empty_square`,
   `03_the_last_door`), each with its own `scene.html` and camera move.
   Shared set-pieces (stone materials, fog, the cloaked figure, the
   color-grade overlay) belong in a `scenes/common/` module so they're
   written once.
2. **A shot list / script pass** — loneliness as a theme benefits from
   contrast between shots (vast empty architecture vs. a close, intimate
   framing of the figure); worth deciding the beats before building more
   geometry.
3. **Sound.** Not yet addressed. `ffmpeg` can mix an ambient drone/bell
   track under the video once one exists as an audio file; there's no
   synthesis tool in this environment, so music/SFX would need to be
   supplied (e.g. generated elsewhere and dropped in as a file, or
   composed directly with Web Audio inside the three.js scene and
   captured by Playwright the same way the video is — this already works
   for video, so it extends naturally).
4. **Concatenation.** Once multiple scene MP4s exist,
   `ffmpeg -f concat` stitches them into the final 3–5 minute cut, with
   crossfades via `xfade` if wanted.
5. **Longer per-scene duration / more coverage** is just raising
   `DURATION_MS`/`HOLD_MS` in each scene and letting `build.sh` record
   longer — the pipeline doesn't change.

Nothing above requires leaving this environment or installing anything new.
