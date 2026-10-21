// Records the real-time three.js/WebGL scene (render/scene.html) by playing it
// in headless Chromium and capturing the actual rendered frames as video.
//
// Usage: node record.js <output-dir>
//
// Requires the global "playwright" package (pre-installed in this environment)
// and the pre-cached Chromium build under PLAYWRIGHT_BROWSERS_PATH.

const { chromium } = require("playwright");
const path = require("path");
const fs = require("fs");

const SCENE_PATH = path.resolve(__dirname, "../render/scene.html");
const WIDTH = 1280;
const HEIGHT = 720;

async function main() {
  const outDir = process.argv[2] || path.resolve(__dirname, "../output/_raw");
  fs.mkdirSync(outDir, { recursive: true });

  const browser = await chromium.launch({
    headless: true,
    args: [
      "--use-gl=swiftshader",
      "--enable-unsafe-swiftshader",
      "--enable-webgl",
      "--ignore-gpu-blocklist",
      "--disable-gpu-sandbox",
      "--no-sandbox",
    ],
  });

  const context = await browser.newContext({
    viewport: { width: WIDTH, height: HEIGHT },
    recordVideo: { dir: outDir, size: { width: WIDTH, height: HEIGHT } },
  });

  const page = await context.newPage();
  const pageErrors = [];
  page.on("pageerror", (err) => pageErrors.push(err.message));
  page.on("console", (msg) => {
    if (msg.type() === "error") pageErrors.push("console: " + msg.text());
  });

  await page.goto("file://" + SCENE_PATH);
  await page.waitForFunction("window.__sceneReady === true", { timeout: 15000 });

  const totalMs = await page.evaluate(() => window.SCENE_TOTAL_MS);
  console.log("Scene duration (ms):", totalMs);

  // Let the real rAF-driven animation play out in real time so the recorded
  // video matches exactly what the renderer produced frame by frame.
  await page.waitForFunction("window.__sceneDone === true", { timeout: totalMs + 15000 });
  // small safety margin so the last frame is flushed into the video container
  await page.waitForTimeout(400);

  const videoHandle = page.video();
  await page.close();
  await context.close();
  await browser.close();

  if (pageErrors.length) {
    console.error("Page errors encountered:\n" + pageErrors.join("\n"));
  }

  const videoPath = await videoHandle.path();
  console.log("RAW_VIDEO_PATH:" + videoPath);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
