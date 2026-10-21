#!/usr/bin/env bash
# Records "The Silent Cathedral" scene (real-time WebGL, played in headless
# Chromium) to a .webm, then encodes it to a verified, playable MP4, plus a
# thumbnail still. No Blender, no external services, no system packages
# beyond what's already in this environment (ffmpeg + Playwright/Chromium).
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OUT_DIR="$SCRIPT_DIR/../output"
RAW_DIR="$OUT_DIR/_raw"
rm -rf "$RAW_DIR"
mkdir -p "$RAW_DIR"

echo "== Recording scene with headless Chromium =="
node "$SCRIPT_DIR/record.js" "$RAW_DIR" | tee "$RAW_DIR/record.log"

WEBM_PATH=$(grep '^RAW_VIDEO_PATH:' "$RAW_DIR/record.log" | sed 's/^RAW_VIDEO_PATH://')
if [ -z "$WEBM_PATH" ] || [ ! -f "$WEBM_PATH" ]; then
  echo "ERROR: recording did not produce a video file." >&2
  exit 1
fi
echo "Raw capture: $WEBM_PATH"

# Playwright's video recording begins at browser-context creation, before the
# page has navigated/initialized — this leaves a short blank/black leader
# (~1.3s on this machine) ahead of the first real rendered frame. Trim it so
# the delivered preview starts right on content.
TRIM_LEAD="1.55"

MP4_FULL="$OUT_DIR/_raw/encoded_full.mp4"
MP4_PATH="$OUT_DIR/silent_cathedral_preview.mp4"
echo "== Encoding MP4 =="
ffmpeg -y -i "$WEBM_PATH" \
  -c:v libx264 -profile:v high -pix_fmt yuv420p -crf 18 -preset slow \
  -movflags +faststart \
  "$MP4_FULL"

echo "== Trimming startup leader (${TRIM_LEAD}s) =="
ffmpeg -y -ss "$TRIM_LEAD" -i "$MP4_FULL" \
  -c:v libx264 -profile:v high -pix_fmt yuv420p -crf 18 -preset slow \
  -movflags +faststart \
  "$MP4_PATH"

echo "== Verifying output =="
ffprobe -v error -select_streams v:0 \
  -show_entries stream=width,height,r_frame_rate,duration,nb_frames,codec_name \
  -of default=noprint_wrappers=1 "$MP4_PATH" | tee "$OUT_DIR/ffprobe_report.txt"

THUMB_PATH="$OUT_DIR/thumbnail.jpg"
ffmpeg -y -ss 00:00:10 -i "$MP4_PATH" -vframes 1 -q:v 2 "$THUMB_PATH"

echo "== Done =="
echo "MP4:       $MP4_PATH"
echo "Thumbnail: $THUMB_PATH"
ls -la "$MP4_PATH" "$THUMB_PATH"
