// شورت «سربازی که ۲۹ سال بعد از جنگ هنوز می‌جنگید» — هر فریم تابعی از زمان است
(function () {
  const W = 1080, H = 1920;
  const cv = document.getElementById('c');
  cv.width = W; cv.height = H;
  const ctx = cv.getContext('2d');
  const font = (w, s) => `${w} ${s}px Vazirmatn`;
  const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
  const lerp = (a, b, t) => a + (b - a) * t;
  const prog = (t, a, d) => clamp((t - a) / d);
  const eo = (x) => 1 - Math.pow(1 - x, 3);
  const eio = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
  const back = (x) => { const c = 1.9; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); };
  const hash = (n) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
  const fa = (n) => String(Math.round(n)).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[d]);
  const pop = (lt, at, d = 0.45) => back(clamp(prog(lt, at, d)));
  const GOLD = '#f2c14e', RED = '#e5383b', CREAM = '#fff4e0', JADE = '#7fd18b';

  // زمان‌بندی از روی صدای گوینده
  const V = window.VOICE, S = [];
  let t0 = 0;
  V.forEach((d, i) => {
    const vs = t0 + (i === 0 ? 0.35 : 0.1);
    const dur = (vs - t0) + d + (i === V.length - 1 ? 1.6 : 0.3);
    S.push({ start: t0, dur, voice: vs }); t0 += dur;
  });
  const TOTAL = t0;

  function text(str, x, y, size, opt = {}) {
    if (size <= 0.5) return;
    ctx.save();
    ctx.font = font(opt.w || 900, size);
    ctx.direction = 'rtl'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    if (opt.stroke !== false) { ctx.lineJoin = 'round'; ctx.lineWidth = size * 0.16; ctx.strokeStyle = 'rgba(0,0,0,0.85)'; ctx.strokeText(str, x, y); }
    if (opt.glow) { ctx.shadowColor = opt.glow; ctx.shadowBlur = 30; }
    ctx.fillStyle = opt.color || CREAM; ctx.fillText(str, x, y);
    ctx.restore();
  }
  function badge(str, y, p, bg = '#ffd400', col = '#111', size = 70) {
    if (p <= 0) return;
    ctx.save(); ctx.translate(W / 2, y); ctx.rotate(-0.03); ctx.scale(p, p);
    ctx.font = font(900, size);
    const tw = ctx.measureText(str).width + 70;
    ctx.fillStyle = bg; ctx.beginPath(); ctx.roundRect(-tw / 2, -size * 0.85, tw, size * 1.7, 18); ctx.fill();
    text(str, 0, 5, size, { color: col, stroke: false });
    ctx.restore();
  }

  // ---------- پس‌زمینه‌ها ----------
  function bg(t, top, bottom) {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, top); g.addColorStop(1, bottom);
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    for (let i = 0; i < 40; i++) { // گرد و غبار معلق
      const x = (hash(i) * W + t * 18 * (0.5 + hash(i + 3))) % W;
      const y = (hash(i + 1) * H - t * 10 * hash(i + 2) + H) % H;
      ctx.fillStyle = `rgba(255,230,180,${0.08 + 0.15 * hash(i + 7)})`;
      ctx.beginPath(); ctx.arc(x, y, 1.5 + 2 * hash(i + 4), 0, 7); ctx.fill();
    }
  }

  function palm(x, y, s, sway, col) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineCap = 'round';
    ctx.lineWidth = 22;
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(30 + sway * 20, -220, 10 + sway * 40, -420); ctx.stroke();
    ctx.translate(10 + sway * 40, -420);
    for (let k = 0; k < 7; k++) {
      const a = -Math.PI + k * (Math.PI / 6) + sway * 0.15;
      ctx.save(); ctx.rotate(a);
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(110, -50, 230, 30); ctx.quadraticCurveTo(110, -10, 0, 0); ctx.fill();
      ctx.restore();
    }
    ctx.restore();
  }
  function jungle(t, y = 1350, light = 0) {
    const layers = [['#0f2a1c', 0.8, 0], ['#0b2015', 1.0, 3], ['#06140d', 1.25, 7]];
    layers.forEach(([c, s, o], L) => {
      for (let i = 0; i < 6; i++) palm(((i * 230 + o * 40 + L * 90) % (W + 300)) - 100, y + L * 120, s * (0.8 + hash(i + o) * 0.4), Math.sin(t * 0.8 + i + L), c);
      ctx.fillStyle = c; ctx.fillRect(0, y + L * 120 - 10, W, H);
      for (let i = 0; i < 14; i++) { // بوته‌ها
        ctx.beginPath(); ctx.arc(i * 85 + (L * 37) % 85, y + L * 120, 60 + hash(i + L) * 50, Math.PI, 0); ctx.fill();
      }
    });
    if (light) { ctx.fillStyle = `rgba(255,180,90,${light})`; ctx.fillRect(0, 0, W, H); }
  }

  // سرباز (سایه‌نما با نور لبه)
  function soldier(x, y, s, t, o = {}) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s * (o.flip ? -1 : 1), s);
    const breathe = Math.sin(t * 2) * 2;
    const col = o.col || '#0c0c0c';
    ctx.fillStyle = col; ctx.strokeStyle = o.rim || 'rgba(242,193,78,0.55)'; ctx.lineWidth = 4; ctx.lineJoin = 'round';
    ctx.beginPath(); // پاها
    ctx.moveTo(-30, 0); ctx.lineTo(-22, -150); ctx.lineTo(22, -150); ctx.lineTo(32, 0); ctx.lineTo(8, 0); ctx.lineTo(0, -100); ctx.lineTo(-8, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.beginPath(); // بدن
    ctx.moveTo(-40, -150); ctx.lineTo(-46, -280 + breathe); ctx.quadraticCurveTo(0, -300 + breathe, 46, -280 + breathe); ctx.lineTo(40, -150); ctx.closePath(); ctx.fill(); ctx.stroke();
    if (o.salute) { // احترام نظامی
      ctx.lineWidth = 22; ctx.strokeStyle = col; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(40, -270); ctx.lineTo(80, -320); ctx.lineTo(28, -345); ctx.stroke();
    } else if (!o.norifle) { // تفنگ روی شانه
      ctx.save(); ctx.translate(30, -250); ctx.rotate(-0.35);
      ctx.fillStyle = col; ctx.fillRect(-8, -170, 12, 260); ctx.fillRect(-14, 40, 24, 60);
      ctx.strokeStyle = o.rim || 'rgba(242,193,78,0.55)'; ctx.lineWidth = 3; ctx.strokeRect(-8, -170, 12, 260);
      ctx.restore();
    }
    // سر و کلاه با پارچهٔ پشت گردن
    ctx.fillStyle = col; ctx.strokeStyle = o.rim || 'rgba(242,193,78,0.55)'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.arc(0, -325 + breathe, 30, 0, 7); ctx.fill(); ctx.stroke();
    if (o.civil) { // غیرنظامی: موی سر و کوله‌پشتی
      ctx.beginPath(); ctx.arc(0, -335 + breathe, 31, Math.PI, 0); ctx.fill();
      ctx.fillRect(-70, -275 + breathe, 30, 90); ctx.strokeRect(-70, -275 + breathe, 30, 90);
      ctx.restore(); return;
    }
    ctx.beginPath(); ctx.moveTo(-36, -335 + breathe); ctx.quadraticCurveTo(0, -385 + breathe, 36, -335 + breathe); ctx.lineTo(48, -330 + breathe); ctx.lineTo(-36, -330 + breathe); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-34, -330 + breathe); ctx.lineTo(-40, -290 + breathe); ctx.lineTo(-18, -300 + breathe); ctx.closePath(); ctx.fill();
    ctx.restore();
  }

  // ---------- نقشه ----------
  const topo = window.WORLD;
  const feats = topojson.feature(topo, topo.objects.countries).features;
  const land = topojson.merge(topo, topo.objects.countries.geometries);
  const LUBANG = [120.12, 13.77], TOKYO = [139.7, 35.7];
  function mapAt(cam, lt, hi) {
    const proj = d3.geoMercator().center(cam.c).scale(cam.s).translate([W / 2, 900]);
    const path = d3.geoPath(proj, ctx);
    ctx.fillStyle = '#123040'; ctx.strokeStyle = 'rgba(160,210,230,0.5)'; ctx.lineWidth = 2;
    ctx.beginPath(); path(land); ctx.fill(); ctx.stroke();
    if (hi) {
      const f = feats.find((x) => x.properties.name === hi);
      ctx.fillStyle = 'rgba(127,209,139,0.35)'; ctx.strokeStyle = JADE; ctx.lineWidth = 3;
      ctx.beginPath(); path(f); ctx.fill(); ctx.stroke();
    }
    return proj;
  }
  function pin(x, y, label, p, t, col = RED) {
    if (p <= 0) return;
    const ph = (t * 0.9) % 1;
    ctx.strokeStyle = `rgba(229,56,59,${0.8 * (1 - ph)})`; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.arc(x, y, 10 + ph * 50, 0, 7); ctx.stroke();
    ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x, y, 14 * p, 0, 7); ctx.fill();
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.stroke();
    text(label, x, y - 60, 52 * p, { color: CREAM });
  }

  // ---------- صحنه‌ها ----------
  function s0(lt, t) { // قلاب
    bg(t, '#1a1208', '#050302');
    jungle(t, 1380);
    const a = pop(lt, 0.1);
    text('۱۹۴۵', W / 2, 400, 220 * a, { color: GOLD, glow: 'rgba(242,193,78,0.6)' });
    badge('پایان جنگ جهانی دوم', 570, pop(lt, 0.8), '#fff', '#111', 58);
    text('اما برای یک سرباز…', W / 2, 760, 76 * pop(lt, 4.6));
    const yrs = Math.round(lerp(0, 29, eo(prog(lt, 6.0, 2.4))));
    if (lt > 6) {
      const p = pop(lt, 6.0);
      ctx.save(); ctx.translate(W / 2, 980); ctx.scale(p, p);
      text(`${fa(yrs)} سال دیگر!`, 0, 0, 130, { color: RED, glow: 'rgba(229,56,59,0.6)' });
      ctx.restore();
    }
    soldier(W / 2, 1640, 1.25, t);
  }

  function s1(lt, t) { // فیلیپین و لوبانگ
    bg(t, '#081521', '#02060a');
    const z = eio(prog(lt, 0.3, 4));
    const cam = { c: [lerp(125, 120.6, z), lerp(20, 13.9, z)], s: lerp(1600, 9000, z) };
    const proj = mapAt(cam, lt, 'Philippines');
    const [x, y] = proj(LUBANG);
    pin(x, y, 'جزیرهٔ لوبانگ', pop(lt, 3.6), t);
    badge('دسامبر ۱۹۴۴', 330, pop(lt, 0.2), GOLD, '#111', 60);
    // کارت معرفی
    const p = eo(prog(lt, 1.0, 0.7));
    if (p > 0) {
      ctx.save(); ctx.globalAlpha = p; ctx.translate(0, (1 - p) * 60);
      ctx.fillStyle = 'rgba(8,10,14,0.85)'; ctx.strokeStyle = GOLD; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.roundRect(110, 1340, 860, 220, 22); ctx.fill(); ctx.stroke();
      text('هیروو اونودا', W / 2, 1410, 76, { color: GOLD });
      text('افسر اطلاعات ارتش ژاپن', W / 2, 1500, 46, { w: 700 });
      ctx.restore();
    }
  }

  function s2(lt, t) { // دستور
    bg(t, '#1d1a14', '#070604');
    const p = eo(prog(lt, 0.1, 0.6));
    ctx.save(); ctx.translate(W / 2, 900); ctx.rotate(-0.04); ctx.scale(lerp(0.6, 1, p), lerp(0.6, 1, p)); ctx.globalAlpha = p;
    ctx.fillStyle = '#efe2c2'; ctx.shadowColor = 'rgba(0,0,0,0.6)'; ctx.shadowBlur = 40;
    ctx.fillRect(-380, -460, 760, 920); ctx.shadowBlur = 0;
    ctx.strokeStyle = '#8a7a5a'; ctx.lineWidth = 3; ctx.strokeRect(-350, -430, 700, 860);
    text('دستور', 0, -330, 90, { color: '#3a2a15', stroke: false });
    ctx.fillStyle = 'rgba(60,40,20,0.25)';
    for (let i = 0; i < 4; i++) ctx.fillRect(-280, -230 + i * 50, 560 - i * 60, 14);
    text('هرگز تسلیم نشو', 0, 40, 84 * pop(lt, 1.2), { color: '#3a2a15', stroke: false });
    text('تا آخرین لحظه بجنگ', 0, 170, 70 * pop(lt, 2.8), { color: '#3a2a15', stroke: false });
    const st = pop(lt, 3.8, 0.3);
    if (st > 0) {
      ctx.save(); ctx.translate(180, 330); ctx.rotate(-0.25); ctx.scale(lerp(2, 1, clamp(st)), lerp(2, 1, clamp(st)));
      ctx.strokeStyle = RED; ctx.lineWidth = 8; ctx.beginPath(); ctx.arc(0, 0, 80, 0, 7); ctx.stroke();
      text('محرمانه', 0, 4, 40, { color: RED, stroke: false });
      ctx.restore();
    }
    ctx.restore();
  }

  function s3(lt, t) { // برگه‌های پایان جنگ
    bg(t, '#16240f', '#040803');
    jungle(t, 1250);
    for (let i = 0; i < 24; i++) {
      const st = hash(i) * 3;
      const y = -100 + (lt - st) * (230 + hash(i + 1) * 120);
      if (y < -100 || y > 1500) continue;
      const x = hash(i + 2) * W + Math.sin(lt * 2 + i) * 60;
      ctx.save(); ctx.translate(x, y); ctx.rotate(Math.sin(lt * 3 + i) * 0.6);
      ctx.fillStyle = '#f4ecd8'; ctx.fillRect(-45, -30, 90, 60);
      ctx.fillStyle = '#222'; ctx.fillRect(-32, -16, 64, 6); ctx.fillRect(-32, -2, 50, 6); ctx.fillRect(-32, 12, 58, 6);
      ctx.restore();
    }
    badge('«جنگ تمام شد!»', 360, pop(lt, 0.6), '#fff', '#111', 72);
    const q = pop(lt, 5.4);
    text('حقهٔ دشمن؟', W / 2, 620, 120 * q, { color: RED, glow: 'rgba(229,56,59,0.5)' });
    soldier(780, 1560, 1.1, t, { flip: true });
  }

  function s4(lt, t) { // سال‌ها می‌گذرد
    bg(t, '#141414', '#040404');
    jungle(t, 1450);
    const y = Math.round(lerp(1946, 1972, prog(lt, 0.2, 6)));
    ctx.save(); ctx.translate(W / 2, 470);
    ctx.fillStyle = '#efe2c2'; ctx.fillRect(-200, -170, 400, 330);
    ctx.fillStyle = RED; ctx.fillRect(-200, -170, 400, 80);
    text('سال', 0, -128, 46, { color: '#fff', stroke: false });
    text(fa(y), 0, 30, 150, { color: '#222', stroke: false });
    ctx.restore();
    // همرزمان
    const marks = [['۱۹۵۰', 'تسلیم شد', 1.4], ['۱۹۵۴', 'کشته شد', 2.8], ['۱۹۷۲', 'کشته شد', 4.2]];
    marks.forEach(([yr, st, at], i) => {
      const x = 230 + i * 310, p = pop(lt, at);
      soldier(x, 1180, 0.62, t, { col: '#1b1b1b', rim: p > 0.5 ? 'rgba(229,56,59,0.6)' : 'rgba(242,193,78,0.4)' });
      if (p > 0) {
        ctx.save(); ctx.globalAlpha = clamp(p);
        text(yr, x, 1240, 44 * p, { color: GOLD });
        text(st, x, 1300, 40 * p, { color: RED });
        ctx.restore();
      }
    });
    const n = pop(lt, 6.0);
    if (n > 0) { ctx.save(); ctx.globalAlpha = clamp(n);
      ctx.fillStyle = 'rgba(0,0,0,0.75)'; ctx.beginPath(); ctx.roundRect(90, 760, 900, 130, 20); ctx.fill();
      text('حدود ۳۰ نفر از مردم محلی جان باختند', W / 2, 826, 48, { w: 800, color: CREAM, stroke: false });
      ctx.restore(); }
  }

  function s5(lt, t) { // اعلام مرگ و تفنگ آماده
    bg(t, '#0f1418', '#030506');
    const p = eo(prog(lt, 0.1, 0.6));
    ctx.save(); ctx.translate(W / 2, 560); ctx.rotate(0.03 - (1 - p) * 0.4); ctx.scale(p, p);
    ctx.fillStyle = '#ece6d6'; ctx.fillRect(-420, -300, 840, 560);
    ctx.fillStyle = '#111'; ctx.fillRect(-380, -260, 760, 14);
    text('روزنامه · ۱۹۵۹', 0, -200, 44, { color: '#333', stroke: false, w: 700 });
    text('اونودا', 0, -70, 120, { color: '#111', stroke: false });
    text('رسماً مرده اعلام شد', 0, 70, 70, { color: '#111', stroke: false });
    ctx.fillStyle = 'rgba(0,0,0,0.25)'; for (let i = 0; i < 3; i++) ctx.fillRect(-340, 150 + i * 30, 680, 12);
    ctx.restore();
    jungle(t, 1560);
    const r = pop(lt, 4.2);
    badge('اما او هنوز در جنگل بود', 1000, r, RED, '#fff', 60);
    soldier(W / 2, 1680, 1.0, t);
  }

  function s6(lt, t) { // پیدا شدن
    bg(t, '#0a0c1a', '#020206');
    for (let i = 0; i < 60; i++) { ctx.fillStyle = `rgba(255,255,255,${0.3 + 0.5 * hash(i)})`; ctx.beginPath(); ctx.arc(hash(i + 1) * W, hash(i + 2) * 900, 1.5 + hash(i + 3) * 2, 0, 7); ctx.fill(); }
    jungle(t, 1300, 0.04 + 0.03 * Math.sin(t * 9));
    // آتش
    const fx = W / 2, fy = 1560;
    const gl = ctx.createRadialGradient(fx, fy, 10, fx, fy, 520);
    gl.addColorStop(0, 'rgba(255,170,60,0.55)'); gl.addColorStop(1, 'rgba(255,170,60,0)');
    ctx.fillStyle = gl; ctx.fillRect(0, 1000, W, 920);
    for (let k = 0; k < 5; k++) {
      const h = 90 + Math.sin(t * 11 + k) * 25;
      ctx.fillStyle = k % 2 ? '#ffb347' : '#ff6b35';
      ctx.beginPath(); ctx.moveTo(fx - 40 + k * 20, fy); ctx.quadraticCurveTo(fx - 50 + k * 22, fy - h * 0.6, fx - 30 + k * 18, fy - h); ctx.quadraticCurveTo(fx - 10 + k * 18, fy - h * 0.5, fx + k * 18 - 20, fy); ctx.fill();
    }
    soldier(fx - 230, 1640, 1.05, t, { rim: 'rgba(255,170,60,0.8)' });
    const sz = eo(prog(lt, 2.4, 1.2));
    soldier(lerp(W + 150, fx + 230, sz), 1640, 0.95, t, { flip: true, rim: 'rgba(255,170,60,0.8)', civil: true, norifle: true });
    badge('فوریه ۱۹۷۴', 330, pop(lt, 0.2), GOLD, '#111', 60);
    text('نوریو سوزوکی', W / 2, 520, 86 * pop(lt, 3.0), { color: CREAM });
    text('جوان ماجراجوی ژاپنی', W / 2, 620, 48 * pop(lt, 3.4), { w: 700, color: GOLD });
  }

  function s7(lt, t) { // شرط اونودا
    bg(t, '#170d0d', '#050202');
    text('»', 870, 360, 260 * pop(lt, 0.1), { color: GOLD, stroke: false });
    const L = ['فقط اگر', 'فرماندهٔ خودم', 'دستور بدهد،', 'سلاحم را زمین می‌گذارم.'];
    L.forEach((s, i) => text(s, W / 2, 560 + i * 120, (i === 1 ? 96 : 74) * pop(lt, 0.6 + i * 0.9), { color: i === 1 ? GOLD : CREAM }));
    text('هیروو اونودا', W / 2, 1110, 48 * pop(lt, 4.4), { w: 700, color: '#bbb' });
    soldier(W / 2, 1720, 1.0, t);
  }

  function s8(lt, t) { // پایان جنگ، ۲۹ سال دیر
    bg(t, '#081521', '#02060a');
    if (lt < 3.2) {
      const proj = mapAt({ c: [130, 25], s: 1500 }, lt);
      const [x0, y0] = proj(TOKYO), [x1, y1] = proj(LUBANG);
      const p = eio(prog(lt, 0.3, 2.4));
      ctx.strokeStyle = GOLD; ctx.lineWidth = 5; ctx.setLineDash([18, 12]);
      ctx.beginPath();
      for (let k = 0; k <= 40 * p; k++) { const u = k / 40; const x = lerp(x0, x1, u), y = lerp(y0, y1, u) - Math.sin(u * Math.PI) * 160; k ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
      ctx.stroke(); ctx.setLineDash([]);
      pin(x0, y0, 'توکیو', 1, t, GOLD); pin(x1, y1, 'لوبانگ', 1, t);
      badge('۹ مارس ۱۹۷۴', 330, pop(lt, 0.1), GOLD, '#111', 60);
    } else {
      jungle(t, 1450, 0.06);
      soldier(330, 1650, 1.0, t, { col: '#151515', norifle: true });
      soldier(760, 1650, 1.05, t, { flip: true, salute: lt > 4.5, norifle: lt > 4.5 });
      // برگهٔ دستور
      ctx.save(); ctx.translate(420, 1300); ctx.rotate(-0.1);
      ctx.fillStyle = '#efe2c2'; ctx.fillRect(-60, -80, 120, 160); ctx.restore();
      badge('دستور: پایان جنگ', 360, pop(lt, 3.3), '#fff', '#111', 66);
      const p = pop(lt, 5.4, 0.35);
      if (p > 0) {
        ctx.save(); ctx.translate(W / 2, 700); ctx.rotate(-0.08); ctx.scale(lerp(2, 1, clamp(p)), lerp(2, 1, clamp(p)));
        ctx.strokeStyle = RED; ctx.lineWidth = 12; ctx.strokeRect(-400, -110, 800, 220);
        text('۲۹ سال دیر!', 0, 8, 130, { color: RED });
        ctx.restore();
      }
    }
  }

  function s9(lt, t) { // پایان
    bg(t, '#120a14', '#040205');
    text('ماجراهای عجیب', W / 2, 560, 100 * pop(lt, 0.1));
    text('و واقعی تاریخ', W / 2, 700, 110 * pop(lt, 0.3), { color: GOLD });
    const p = pop(lt, 0.8);
    ctx.save(); ctx.translate(W / 2, 980); const s = p * (1 + 0.04 * Math.sin(lt * 6)); ctx.scale(s, s);
    ctx.fillStyle = RED; ctx.shadowColor = 'rgba(229,56,59,0.7)'; ctx.shadowBlur = 40;
    ctx.beginPath(); ctx.roundRect(-300, -80, 600, 160, 26); ctx.fill(); ctx.shadowBlur = 0;
    text('سابسکرایب', 0, 6, 80, { stroke: false, color: '#fff' });
    ctx.restore();
  }

  const SC = [s0, s1, s2, s3, s4, s5, s6, s7, s8, s9];

  function render(t) {
    t = clamp(t, 0, TOTAL - 1e-4);
    let i = S.length - 1;
    while (i > 0 && t < S[i].start) i--;
    const lt = t - S[i].start;
    ctx.save(); SC[i](lt, t); ctx.restore();
    ctx.save(); ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.beginPath(); ctx.roundRect(W / 2 - 250, 110, 500, 70, 35); ctx.fill(); ctx.restore();
    text('ماجراهای واقعی تاریخ', W / 2, 146, 38, { w: 800, color: GOLD, stroke: false });
    const f = 1 - prog(lt, 0, 0.18);
    if (i > 0 && f > 0) { ctx.fillStyle = `rgba(255,240,220,${0.45 * f})`; ctx.fillRect(0, 0, W, H); }
    // نوار سینمایی و پیشرفت
    ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(0, H - 14, W, 14);
    ctx.fillStyle = GOLD; ctx.fillRect(0, H - 14, W * t / TOTAL, 14);
    const v = ctx.createRadialGradient(W / 2, H / 2, 600, W / 2, H / 2, 1200);
    v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,0.45)');
    ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
    const blk = 1 - Math.min(prog(t, 0, 0.25), 1 - prog(t, TOTAL - 0.5, 0.5));
    if (blk > 0) { ctx.fillStyle = `rgba(0,0,0,${blk})`; ctx.fillRect(0, 0, W, H); }
  }

  window.render = render;
  window.TOTAL = TOTAL;
  window.TIMELINE = { total: TOTAL, scenes: S };
})();
