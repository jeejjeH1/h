// رندر فریم‌ها با Chromium و ساخت ویدیو با ffmpeg
// استفاده:
//   node render.mjs                 → رندر کامل (out/frames.mp4 + out/timeline.json)
//   node render.mjs --stills 5,60   → فقط چند فریم PNG برای بازبینی
//   node render.mjs --thumb         → تصویر بندانگشتی
import { createRequire } from 'node:module';
import { spawn, execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require('playwright')); }
catch { ({ chromium } = require(path.join(execSync('npm root -g').toString().trim(), 'playwright'))); }

const DIR = path.dirname(new URL(import.meta.url).pathname);
const OUT = path.join(DIR, 'out');
fs.mkdirSync(OUT, { recursive: true });
const FPS = +(process.env.FPS || 30);
const WORKERS = +(process.env.WORKERS || Math.max(1, Math.min(4, os.cpus().length)));
const args = process.argv.slice(2);
const URL_ = 'file://' + path.join(DIR, 'index.html') + '?render';

const launchOpts = { args: ['--force-color-profile=srgb', '--disable-lcd-text'] };
if (fs.existsSync('/opt/pw-browsers/chromium')) launchOpts.executablePath = undefined;

async function openPage(browser) {
  const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => console.error('page error:', e.message));
  await page.goto(URL_);
  await page.evaluate(() => window.READY);
  return page;
}

const browser = await chromium.launch(launchOpts);

if (args[0] === '--stills') {
  const page = await openPage(browser);
  for (const t of args[1].split(',').map(Number)) {
    await page.evaluate((t) => render(t), t);
    await page.screenshot({ path: path.join(OUT, `still_${t}.png`) });
    console.log('still', t);
  }
  await browser.close();
  process.exit(0);
}

if (args[0] === '--thumb2') {
  const page = await openPage(browser);
  for (const v of ['a', 'b']) {
    await page.evaluate((v) => renderThumbnail2(v), v);
    const big = path.join(OUT, `thumb2_${v}_1080.png`);
    await page.screenshot({ path: big });
    execSync(`ffmpeg -y -loglevel error -i "${big}" -vf scale=1280:720:flags=lanczos "${path.join(OUT, `thumbnail_${v}.png`)}"`);
  }
  console.log('thumbnails ok');
  await browser.close();
  process.exit(0);
}

if (args[0] === '--thumb') {
  const page = await openPage(browser);
  await page.evaluate(() => renderThumbnail());
  await page.screenshot({ path: path.join(OUT, 'thumbnail_1080.png') });
  execSync(`ffmpeg -y -loglevel error -i "${path.join(OUT, 'thumbnail_1080.png')}" -vf scale=1280:720:flags=lanczos "${path.join(OUT, 'thumbnail.png')}"`);
  console.log('thumbnail ok');
  await browser.close();
  process.exit(0);
}

const probe = await openPage(browser);
const total = await probe.evaluate(() => TOTAL);
const timeline = await probe.evaluate(() => TIMELINE);
fs.writeFileSync(path.join(OUT, 'timeline.json'), JSON.stringify({ total, fps: FPS, scenes: timeline }, null, 1));
await probe.context().close();

const frames = Math.ceil(total * FPS);
console.log(`مدت: ${total.toFixed(1)} ثانیه، ${frames} فریم، ${WORKERS} پردازشگر`);

const chunk = Math.ceil(frames / WORKERS);
const t0 = Date.now();
let done = 0;

async function worker(w) {
  const a = w * chunk, b = Math.min(frames, a + chunk);
  if (a >= b) return null;
  const page = await openPage(browser);
  const file = path.join(OUT, `part${w}.mp4`);
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-',
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '19', '-pix_fmt', 'yuv420p', '-tune', 'animation', '-g', String(FPS * 2), file],
    { stdio: ['pipe', 'inherit', 'inherit'] });
  const finished = new Promise((res, rej) => ff.on('close', (c) => (c === 0 ? res() : rej(new Error('ffmpeg ' + c)))));
  for (let f = a; f < b; f++) {
    await page.evaluate((t) => render(t), f / FPS);
    const buf = await page.screenshot({ type: 'jpeg', quality: 95 });
    if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
    done++;
    if (done % 300 === 0) {
      const el = (Date.now() - t0) / 1000;
      console.log(`${done}/${frames}  ${(done / el).toFixed(1)} fps  باقی‌مانده ≈ ${((frames - done) / (done / el) / 60).toFixed(1)} دقیقه`);
    }
  }
  ff.stdin.end();
  await finished;
  return file;
}

const parts = (await Promise.all([...Array(WORKERS).keys()].map(worker))).filter(Boolean);
await browser.close();
fs.writeFileSync(path.join(OUT, 'parts.txt'), parts.map((p) => `file '${p}'`).join('\n'));
execSync(`ffmpeg -y -loglevel error -f concat -safe 0 -i "${path.join(OUT, 'parts.txt')}" -c copy "${path.join(OUT, 'frames.mp4')}"`);
parts.forEach((p) => fs.unlinkSync(p));
console.log(`پایان رندر تصویر در ${((Date.now() - t0) / 60000).toFixed(1)} دقیقه`);
