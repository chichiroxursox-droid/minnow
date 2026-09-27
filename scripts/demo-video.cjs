// Walks the demo path on the production URL headlessly, taking screenshots and recording a video.
//   NODE_PATH=$(npm root -g) node scripts/demo-video.cjs [url] [outdir]
// Uses the globally installed playwright, so nothing is added to package.json.
// Set MOBILE=1 to run at a phone viewport instead. Writes beats.json (seconds from the start of the
// recording for each demo beat) so scripts/narrate.ts can lay narration over the video.
const { chromium, devices } = require("playwright");
const fs = require("node:fs");

const url = process.argv[2] || "https://minnow-chiethan.vercel.app";
const out = process.argv[3] || ".tmp-demo";
const device = process.env.MOBILE ? devices["iPhone 13"] : { viewport: { width: 1280, height: 800 } };
const size = device.viewport;

(async () => {
  fs.mkdirSync(out, { recursive: true });
  // Fake microphone so "Your turn" works headlessly.
  const browser = await chromium.launch({ args: ["--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream"] });
  const ctx = await browser.newContext({ ...device, permissions: ["microphone"], recordVideo: { dir: out, size } });
  const page = await ctx.newPage();
  const t0 = Date.now();
  const beats = [];
  const beat = (name, extra = {}) => beats.push({ name, t: (Date.now() - t0) / 1000, ...extra });
  const shot = (name) => page.screenshot({ path: `${out}/${name}.png` });
  const pause = (ms) => page.waitForTimeout(ms);
  const check = page.getByPlaceholder("type any word");
  const typeCheck = async (word) => {
    await check.fill("");
    await check.pressSequentially(word, { delay: 110 });
    await page.waitForSelector('[data-testid="check-result"]');
    await pause(2200);
  };
  const buildLive = async () => {
    await page.getByRole("button", { name: "Build set" }).click();
    // On the cached path the loading screen can flash by in under a frame.
    await page.waitForSelector('[data-testid="loading"]', { timeout: 3000 }).catch(() => {});
    await page.waitForSelector('[data-testid="loading"]', { state: "detached", timeout: 40000 });
    await page.waitForSelector('[data-testid="passes"]');
  };

  await page.goto(url, { waitUntil: "networkidle" });
  beat("intro");
  await pause(1200);
  await shot("01-loaded");
  await pause(12000);

  // Pre-filled /k/ initial ocean age 6. Build a live set.
  beat("build");
  await buildLive();
  await pause(1200);
  await page.locator('[data-testid="passes"]').scrollIntoViewIfNeeded();
  await pause(3500);
  await shot("02-built");

  // Judge types words into the check box.
  await check.scrollIntoViewIfNeeded();
  beat("check");
  await typeCheck("knot");
  await shot("03-knot");
  await typeCheck("ocean");
  await shot("04-ocean");
  await typeCheck("coral");
  await shot("05-coral");
  await pause(2000); // let the check narration finish before Play

  // Play a verified word, then the child's turn, then hear it back.
  const play = page.getByRole("button", { name: /^Play / }).first();
  await play.scrollIntoViewIfNeeded();
  // The recording has no page audio, so note the word; narrate.ts mixes its cached MP3 back in.
  beat("play", { word: (await play.getAttribute("aria-label")).replace(/^Play /, "") });
  await play.click();
  await pause(700);
  await shot("06-playing");
  await pause(1800);
  await page.getByRole("button", { name: /^Your turn / }).first().click();
  await pause(600);
  await shot("06b-listening");
  await page.getByRole("button", { name: /^Play yours / }).first().waitFor({ timeout: 8000 });
  await page.getByRole("button", { name: /^Play yours / }).first().click();
  await pause(1500);
  await shot("06c-played-back");
  // Slow the model voice down.
  beat("slow");
  await page.getByRole("button", { name: "Slow", exact: true }).click();
  await play.click();
  await pause(2500);
  await shot("06d-slow");

  // Switch to the /r/ medial seed: the cached set shows at once, rejects first.
  await page.getByRole("button", { name: /\/r\/ medial/ }).scrollIntoViewIfNeeded();
  beat("rmedial");
  await page.getByRole("button", { name: /\/r\/ medial/ }).click();
  await page.waitForSelector('[data-testid="rejects"]');
  await pause(1500);
  await page.locator('[data-testid="rejects"]').scrollIntoViewIfNeeded();
  beat("rejects");
  await pause(7000);
  await shot("07-r-medial");

  // Family mode: the essentials, one picture card at a time.
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "smooth" }));
  await pause(700);
  beat("family");
  await page.getByRole("button", { name: "Family", exact: true }).click();
  await pause(2200);
  await shot("08-family");
  await page.getByRole("button", { name: /^l start/ }).click();
  await page.waitForSelector('[data-testid="flashcards"]');
  await page.locator('[data-testid="flashcards"]').scrollIntoViewIfNeeded();
  await pause(4500);
  const hear = page.getByRole("button", { name: /^Play / }).first();
  beat("hear", { word: (await hear.getAttribute("aria-label")).replace(/^Play /, "") });
  await hear.click();
  await pause(1800);
  await shot("09-flashcard");
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await pause(900);
  beat("outro");
  await pause(4800);
  await shot("10-next");
  beat("end");

  const video = page.video();
  await ctx.close();
  await browser.close();
  fs.writeFileSync(`${out}/beats.json`, JSON.stringify(beats, null, 2));
  console.log("video:", await video.path());
  console.log("beats:", beats.map((b) => `${b.name}@${b.t.toFixed(1)}s`).join(" "));
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
