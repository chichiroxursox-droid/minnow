// Walks the demo path on the production URL headlessly, taking screenshots and recording a video.
//   NODE_PATH=$(npm root -g) node scripts/demo-video.cjs [url] [outdir]
// Uses the globally installed playwright, so nothing is added to package.json.
// Set MOBILE=1 to run at a phone viewport instead.
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
  const shot = (name) => page.screenshot({ path: `${out}/${name}.png` });
  const pause = (ms) => page.waitForTimeout(ms);
  const check = page.getByPlaceholder("type any word");
  const typeCheck = async (word) => {
    await check.fill("");
    await check.pressSequentially(word, { delay: 110 });
    await page.waitForSelector('[data-testid="check-result"]');
    await pause(1800);
  };

  await page.goto(url, { waitUntil: "networkidle" });
  await pause(1500);
  await shot("01-loaded");

  // Pre-filled /k/ initial ocean age 6. Build.
  await page.getByRole("button", { name: "Build set" }).click();
  await page.waitForSelector('[data-testid="passes"]', { timeout: 25000 });
  await pause(1200);
  await page.locator("section").last().scrollIntoViewIfNeeded();
  await pause(2500);
  await shot("02-built");

  // Judge types words into the check box.
  await check.scrollIntoViewIfNeeded();
  await typeCheck("knot");
  await shot("03-knot");
  await typeCheck("ocean");
  await shot("04-ocean");
  await typeCheck("coral");
  await shot("05-coral");

  // Play a verified word, then the child's turn, then hear it back.
  const play = page.getByRole("button", { name: /^Play / }).first();
  await play.scrollIntoViewIfNeeded();
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
  await page.getByRole("button", { name: "Slow", exact: true }).click();
  await play.click();
  await pause(2500);
  await shot("06d-slow");

  // Switch to the /r/ medial preset and build again.
  await page.getByRole("button", { name: /\/r\/ medial/ }).scrollIntoViewIfNeeded();
  await page.getByRole("button", { name: /\/r\/ medial/ }).click();
  await pause(800);
  await page.getByRole("button", { name: "Build set" }).click();
  await page.waitForSelector('[data-testid="passes"]', { timeout: 25000 });
  await pause(1000);
  await page.locator('[data-testid="rejects"], [data-testid="passes"]').first().scrollIntoViewIfNeeded();
  await pause(3000);
  await shot("07-r-medial");

  const video = page.video();
  await ctx.close();
  await browser.close();
  console.log("video:", await video.path());
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
