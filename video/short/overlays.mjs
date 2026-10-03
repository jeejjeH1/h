// ساخت لایه‌های گرافیکی شورت (عنوان بالا و کارت پایانی) با Chromium
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
import path from 'node:path';
const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require('playwright')); }
catch { ({ chromium } = require(path.join(execSync('npm root -g').toString().trim(), 'playwright'))); }
const DIR = path.dirname(new URL(import.meta.url).pathname);
const fonts = ['Regular:400', 'Bold:700', 'Black:900'].map((f) => {
  const [n, w] = f.split(':');
  return `@font-face{font-family:V;src:url(file://${DIR}/../fonts/Vazirmatn-${n}.ttf);font-weight:${w}}`;
}).join('');
const base = `<meta charset=utf-8><style>${fonts}html,body{margin:0;background:transparent;font-family:V;direction:rtl;color:#fff}</style>`;

const header = `${base}<div style="width:1080px;height:300px;display:flex;flex-direction:column;align-items:center;justify-content:center;
  background:linear-gradient(#05070fee,#05070fcc 70%,#05070f00)">
  <div style="font-weight:900;font-size:66px;line-height:1.15;text-shadow:0 4px 0 #000,0 0 30px #000">بزرگ‌ترین امپراتوری جهان باستان</div>
  <div style="font-weight:900;font-size:86px;line-height:1.15;background:linear-gradient(#fff1b8,#ffc93c 55%,#e08a12);-webkit-background-clip:text;color:transparent;filter:drop-shadow(0 4px 0 #000) drop-shadow(0 0 22px #ffb43080)">ایرانی بود!</div>
  <div style="margin-top:8px;font-weight:700;font-size:30px;color:#f1e6c8;background:#0009;padding:4px 22px;border-radius:30px;border:1.5px solid #e0b35488">شاهنشاهی هخامنشی · ۵۵۰ تا ۳۳۰ پیش از میلاد</div>
</div>`;

const endcard = `${base}<div style="width:1080px;height:1920px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:34px;
  background:radial-gradient(circle at 50% 45%,#0b1226f2,#020309fa)">
  <div style="font-weight:700;font-size:46px;color:#e0b354">این فقط یک فصل بود…</div>
  <div style="font-weight:900;font-size:92px;text-align:center;line-height:1.2">داستان <span style="color:#ffc93c">۵۰۰۰ ساله</span><br>ایران</div>
  <div style="font-weight:700;font-size:48px;background:#ffd400;color:#111;padding:14px 40px;transform:rotate(-2deg)">ویدیوی کامل ۱۴ دقیقه‌ای در کانال</div>
  <div style="margin-top:40px;font-weight:900;font-size:58px;background:#d62b2b;padding:20px 60px;border-radius:22px;box-shadow:0 0 40px #d62b2b99">سابسکرایب کنید</div>
</div>`;

const caption = `${base}<div style="width:1080px;height:728px;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center">
  <div style="font-weight:900;font-size:78px;line-height:1.35;text-shadow:0 5px 0 #000,0 0 30px #000">آیا می‌دانستید<br><span style="background:#ffd400;color:#111;padding:0 18px;text-shadow:none">بزرگ‌ترین امپراتوری</span><br>جهان باستان<br><span style="color:#ffc93c">ایرانی</span> بود؟</div>
</div>`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
for (const [name, html, h] of [['header', header, 300], ['endcard', endcard, 1920], ['caption', caption, 728]]) {
  await page.setContent(html);
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(DIR, `${name}.png`), omitBackground: true, clip: { x: 0, y: 0, width: 1080, height: h } });
}
await browser.close();
console.log('overlays ok');
