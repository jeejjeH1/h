// شورت «جنگ اِموها» — هر فریم تابعی از زمان است (render(t))
(function () {
  const W = 1080, H = 1920;
  const cv = document.getElementById('c');
  cv.width = W; cv.height = H;
  const ctx = cv.getContext('2d');
  const F = 'Vazirmatn';
  const font = (w, s) => `${w} ${s}px ${F}`;
  const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
  const lerp = (a, b, t) => a + (b - a) * t;
  const prog = (t, a, d) => clamp((t - a) / d);
  const eo = (x) => 1 - Math.pow(1 - x, 3);
  const eio = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
  const back = (x) => { const c = 1.9; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); };
  const hash = (n) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
  const fa = (n) => String(n).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[d]);
  const faNum = (n) => fa(Math.round(n).toLocaleString('en-US')).replace(/,/g, '٬');

  const SAND = '#f2b24c', RED = '#e5383b', CREAM = '#fff4e0';

  // ---------- زمان‌بندی از روی صدای گوینده ----------
  const V = window.VOICE;
  const GAP = 0.25, LEAD = 0.35;
  const S = []; // [start, dur] هر صحنه
  let t0 = 0;
  V.forEach((d, i) => {
    const vs = t0 + (i === 0 ? LEAD : 0.1);
    const dur = (vs - t0) + d + (i === V.length - 1 ? 1.6 : GAP);
    S.push({ start: t0, dur, voice: vs });
    t0 += dur;
  });
  const TOTAL = t0;

  // ---------- ابزار متن ----------
  function text(str, x, y, size, opt = {}) {
    ctx.save();
    ctx.font = font(opt.w || 900, size);
    ctx.direction = 'rtl';
    ctx.textAlign = opt.align || 'center';
    ctx.textBaseline = 'middle';
    if (opt.stroke !== false) {
      ctx.lineJoin = 'round';
      ctx.lineWidth = opt.sw || size * 0.16;
      ctx.strokeStyle = opt.sc || 'rgba(0,0,0,0.85)';
      ctx.strokeText(str, x, y);
    }
    if (opt.glow) { ctx.shadowColor = opt.glow; ctx.shadowBlur = 30; }
    ctx.fillStyle = opt.color || CREAM;
    ctx.fillText(str, x, y);
    ctx.restore();
  }
  function pop(lt, at, d = 0.45) { return back(clamp(prog(lt, at, d))); }

  // ---------- اِمو ----------
  function emu(x, y, s, phase, dir = 1, color = '#3b2a20') {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s * dir, s);
    const bob = Math.sin(phase * 2) * 3;
    ctx.translate(0, bob);
    ctx.fillStyle = color;
    ctx.strokeStyle = color;
    ctx.lineCap = 'round';
    // پاها
    ctx.lineWidth = 6;
    for (let k = 0; k < 2; k++) {
      const a = Math.sin(phase + k * Math.PI) * 0.7;
      const kx = Math.sin(a) * 34, ky = 40 + Math.cos(a) * 6;
      const fx = kx + Math.sin(a + 0.6) * 34, fy = ky + 40;
      ctx.beginPath(); ctx.moveTo(0, 18); ctx.lineTo(kx, ky); ctx.lineTo(fx, fy); ctx.lineTo(fx + 14, fy); ctx.stroke();
    }
    // بدن پرپشت
    ctx.beginPath();
    ctx.ellipse(-6, 0, 58, 38, -0.12, 0, Math.PI * 2);
    ctx.fill();
    for (let k = 0; k < 7; k++) { // پرهای دم
      ctx.beginPath(); ctx.ellipse(-50 - k * 2, 6 + k * 4, 18, 8, 0.6, 0, Math.PI * 2); ctx.fill();
    }
    // گردن و سر
    ctx.lineWidth = 13;
    ctx.beginPath(); ctx.moveTo(36, -14); ctx.quadraticCurveTo(58, -50, 52, -92); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(58, -98, 15, 11, 0.2, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.moveTo(68, -102); ctx.lineTo(90, -95); ctx.lineTo(68, -91); ctx.fill();
    ctx.fillStyle = '#ffd36b';
    ctx.beginPath(); ctx.arc(62, -101, 3.5, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  function truck(x, y, s, t) {
    ctx.save();
    ctx.translate(x, y + Math.abs(Math.sin(t * 9)) * -6);
    ctx.scale(s, s);
    ctx.fillStyle = '#4f5d3a';
    ctx.fillRect(-90, -50, 120, 50);
    ctx.fillStyle = '#65784a';
    ctx.beginPath(); ctx.moveTo(30, -50); ctx.lineTo(70, -50); ctx.lineTo(90, -20); ctx.lineTo(90, 0); ctx.lineTo(30, 0); ctx.fill();
    ctx.fillStyle = '#9fd3e6'; ctx.fillRect(42, -44, 26, 18);
    ctx.strokeStyle = '#222'; ctx.lineWidth = 6; // مسلسل
    ctx.beginPath(); ctx.moveTo(-30, -50); ctx.lineTo(-30, -70); ctx.lineTo(25, -78); ctx.stroke();
    ctx.fillStyle = '#1a1a1a';
    for (const wx of [-60, 55]) { ctx.beginPath(); ctx.arc(wx, 2, 18, 0, Math.PI * 2); ctx.fill(); }
    ctx.restore();
    // گرد و خاک
    for (let i = 0; i < 8; i++) {
      const p = ((t * 1.6 + i / 8) % 1);
      ctx.fillStyle = `rgba(230,180,110,${0.35 * (1 - p)})`;
      ctx.beginPath(); ctx.arc(x - 110 * s - p * 160, y + 10 - p * 30, (10 + p * 40) * s, 0, Math.PI * 2); ctx.fill();
    }
  }

  // ---------- پس‌زمینه ----------
  function bg(t, top = '#2a120a', bottom = '#0d0604') {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, top); g.addColorStop(1, bottom);
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    // پرتوهای خورشید
    ctx.save();
    ctx.translate(W / 2, 760);
    ctx.rotate(t * 0.05);
    for (let i = 0; i < 18; i++) {
      ctx.rotate((Math.PI * 2) / 18);
      ctx.fillStyle = i % 2 ? 'rgba(255,170,80,0.035)' : 'rgba(255,170,80,0.0)';
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(1400, -120); ctx.lineTo(1400, 120); ctx.fill();
    }
    ctx.restore();
    // ذرات گرد و غبار
    for (let i = 0; i < 40; i++) {
      const x = (hash(i) * W + t * 20 * (0.5 + hash(i + 3))) % W;
      const y = (hash(i + 1) * H - t * 12 * hash(i + 2) + H) % H;
      ctx.fillStyle = `rgba(255,210,150,${0.12 + 0.2 * hash(i + 7)})`;
      ctx.beginPath(); ctx.arc(x, y, 1.5 + 2.5 * hash(i + 4), 0, Math.PI * 2); ctx.fill();
    }
  }

  function ground(y, color = '#5a3418') {
    ctx.fillStyle = color;
    ctx.beginPath(); ctx.moveTo(0, y);
    for (let x = 0; x <= W; x += 60) ctx.lineTo(x, y + Math.sin(x * 0.01) * 10);
    ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.fill();
  }

  // ---------- نقشهٔ استرالیا ----------
  const topo = window.WORLD;
  const aus = topojson.feature(topo, topo.objects.countries).features.find((f) => f.properties.name === 'Australia');
  const proj = d3.geoMercator().center([134, -27]).scale(1250).translate([W / 2, 860]);
  const ausPath = new Path2D(d3.geoPath(proj)(aus));
  const CAMPION = proj([118.6, -31.1]);
  const [waX] = proj([129, -25]);

  // ---------- صحنه‌ها ----------
  function scene0(lt, t) { // قلاب
    bg(t, '#3a0f0a', '#0b0403');
    ground(1420, '#4a2612');
    const shake = lt > 4.3 && lt < 4.8 ? Math.sin(lt * 90) * 14 : 0;
    ctx.save(); ctx.translate(shake, 0);
    const a = pop(lt, 0.1);
    ctx.save(); ctx.translate(W / 2, 470); ctx.scale(a, a);
    text('۱۹۳۲', 0, 0, 230, { color: SAND, glow: 'rgba(255,170,60,0.6)' });
    ctx.restore();
    text('ارتش استرالیا', W / 2, 680, 84 * pop(lt, 0.7));
    text('به جنگ پرندگان رفت…', W / 2, 790, 78 * pop(lt, 1.4), { color: SAND });
    // اموی دونده
    const ex = lerp(-200, W + 200, ((lt * 0.32) % 1));
    emu(ex, 1300, 2.4, lt * 12, 1);
    // مهر «و شکست خورد!»
    const st = pop(lt, 4.2, 0.35);
    if (st > 0) {
      ctx.save(); ctx.translate(W / 2, 1000); ctx.rotate(-0.12); ctx.scale(lerp(2.2, 1, clamp(st)), lerp(2.2, 1, clamp(st)));
      ctx.globalAlpha = clamp(st);
      ctx.strokeStyle = RED; ctx.lineWidth = 12;
      ctx.strokeRect(-380, -95, 760, 190);
      text('و شکست خورد!', 0, 6, 120, { color: RED, sc: 'rgba(0,0,0,0.6)' });
      ctx.restore();
    }
    ctx.restore();
  }

  function scene1(lt, t) { // ۲۰ هزار امو
    bg(t, '#10202a', '#05090c');
    const a = eo(prog(lt, 0, 0.8));
    ctx.save();
    ctx.globalAlpha = a;
    ctx.fillStyle = '#2c3e4a'; ctx.fill(ausPath);
    ctx.save(); ctx.clip(ausPath);
    ctx.fillStyle = 'rgba(242,178,76,0.55)'; ctx.fillRect(0, 0, waX, H);
    ctx.restore();
    ctx.strokeStyle = '#9cc3d8'; ctx.lineWidth = 3; ctx.stroke(ausPath);
    ctx.restore();
    text('غرب استرالیا', waX - 230, 700, 44 * pop(lt, 0.6), { w: 800 });
    // مزرعهٔ گندم
    const [cx, cy] = CAMPION;
    const fp = eo(prog(lt, 1.0, 0.6));
    ctx.fillStyle = `rgba(255,215,90,${0.8 * fp})`;
    ctx.beginPath(); ctx.arc(cx, cy, 46 * fp, 0, Math.PI * 2); ctx.fill();
    // هجوم اموها به سوی مزرعه
    for (let i = 0; i < 70; i++) {
      const st = 1.4 + hash(i) * 4.5;
      const p = prog(lt, st, 1.6 + hash(i + 2));
      if (p <= 0) continue;
      const ang = -1.2 + hash(i + 5) * 2.6;
      const r0 = 520 + hash(i + 9) * 200;
      const x = cx + Math.cos(ang) * r0 * (1 - eio(p)) + (hash(i + 11) - 0.5) * 60 * eio(p);
      const y = cy + Math.sin(ang) * r0 * 0.7 * (1 - eio(p)) + (hash(i + 13) - 0.5) * 50 * eio(p);
      emu(x, y, 0.32, lt * 14 + i, Math.cos(ang) > 0 ? -1 : 1, '#1d130d');
    }
    // شمارنده
    const n = 20000 * eo(prog(lt, 1.2, 3.5));
    text(faNum(n), W / 2, 330, 190 * pop(lt, 1.0), { color: SAND, glow: 'rgba(255,170,60,0.5)' });
    text('اِمو', W / 2, 480, 90 * pop(lt, 1.3));
    text('پرنده‌ای بزرگ و بی‌پرواز', W / 2, 1420, 54 * pop(lt, 2.4), { w: 700, color: '#d9ecf5' });
  }

  function scene2(lt, t) { // ارتش
    bg(t, '#1b2412', '#070a05');
    text('ارتش وارد می‌شود', W / 2, 330, 92 * pop(lt, 0.1), { color: '#c9e08a' });
    const cards = [['۳', 'سرباز', '', 1.0], ['۲', 'مسلسل', '', 2.6], ['۱۰٬۰۰۰', 'گلوله', '', 4.4]];
    cards.forEach(([v, l, ic, at], i) => {
      const p = pop(lt, at, 0.5);
      if (p <= 0) return;
      const y = 620 + i * 300;
      ctx.save(); ctx.translate(W / 2, y); ctx.scale(clamp(p, 0, 1.2), clamp(p, 0, 1.2));
      ctx.fillStyle = 'rgba(20,28,12,0.85)'; ctx.strokeStyle = '#8fae4f'; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.roundRect(-430, -120, 860, 240, 30); ctx.fill(); ctx.stroke();
      const val = i === 2 ? faNum(10000 * eo(prog(lt, at, 1.6))) : v;
      text(val, 150, 0, 140, { color: SAND });
      text(l, -170, 0, 96);
      ctx.restore();
    });
    text('در برابر ۲۰٬۰۰۰ اِمو', W / 2, 1560, 62 * pop(lt, 6.2), { color: RED });
  }

  function scene3(lt, t) { // شکست‌ها
    bg(t, '#3a1d0d', '#0d0703');
    ground(1060, '#6b3d1a');
    // اموهای پراکنده
    for (let i = 0; i < 26; i++) {
      const dir = hash(i) > 0.5 ? 1 : -1;
      const sp = 220 + hash(i + 1) * 260;
      const x = ((hash(i + 2) * W + dir * lt * sp) % (W + 300) + W + 300) % (W + 300) - 150;
      const y = 1000 + hash(i + 3) * 260;
      emu(x, y, 0.55 + hash(i + 4) * 0.35, lt * 15 + i, dir, '#24170f');
    }
    // کامیون در تعقیب
    const tx = lerp(-200, 700, eio(prog(lt, 4.5, 3.2)));
    if (lt > 4.5) {
      truck(tx, 1400, 1.25, lt);
      emu(tx + 320 + Math.min(260, (lt - 4.5) * 90), 1370, 1.0, lt * 18, 1, '#24170f');
    }
    const labels = [['دسته‌دسته پراکنده شدند', 0.5, SAND], ['مسلسل گیر کرد!', 2.6, RED], ['کامیون هم جا ماند', 4.8, CREAM]];
    labels.forEach(([s, at, c], i) => {
      const p = pop(lt, at, 0.4);
      if (p > 0) {
        ctx.save(); ctx.translate(W / 2, 360 + i * 170); ctx.rotate((i % 2 ? 1 : -1) * 0.03); ctx.scale(p, p);
        text(s, 0, 0, 80, { color: c });
        ctx.restore();
      }
    });
    const sp = pop(lt, 6.4, 0.4);
    if (sp > 0) {
      ctx.save(); ctx.translate(W / 2, 870); ctx.scale(sp, sp);
      ctx.fillStyle = '#ffd400'; ctx.beginPath(); ctx.roundRect(-400, -70, 800, 140, 20); ctx.fill();
      text('سرعت اِمو: ۵۰ کیلومتر بر ساعت', 0, 4, 58, { color: '#111', stroke: false });
      ctx.restore();
    }
  }

  function scene4(lt, t) { // آمار
    bg(t, '#200a0a', '#080303');
    // باران گلوله
    for (let i = 0; i < 60; i++) {
      const x = hash(i) * W;
      const y = ((hash(i + 1) * H + lt * (500 + hash(i + 2) * 600)) % (H + 100)) - 50;
      ctx.save(); ctx.translate(x, y); ctx.rotate(0.3);
      ctx.fillStyle = 'rgba(214,160,60,0.35)';
      ctx.beginPath(); ctx.roundRect(-5, -16, 10, 32, 5); ctx.fill();
      ctx.restore();
    }
    const b = 9860 * eo(prog(lt, 0.3, 2.2));
    text(faNum(b), W / 2, 470, 170 * pop(lt, 0.2), { color: SAND });
    text('گلوله شلیک شد', W / 2, 610, 70 * pop(lt, 0.5));
    const ar = pop(lt, 2.0);
    if (ar > 0) { ctx.save(); ctx.translate(W / 2, 765); ctx.scale(ar, ar); ctx.fillStyle = CREAM;
      ctx.fillRect(-14, -50, 28, 50); ctx.beginPath(); ctx.moveTo(-45, 0); ctx.lineTo(45, 0); ctx.lineTo(0, 50); ctx.fill(); ctx.restore(); }
    const e = 986 * eo(prog(lt, 2.3, 1.5));
    text(faNum(e), W / 2, 920, 170 * pop(lt, 2.2), { color: RED });
    text('اِمو کشته شد', W / 2, 1060, 70 * pop(lt, 2.5));
    const p = pop(lt, 4.3, 0.45);
    if (p > 0) {
      ctx.save(); ctx.translate(W / 2, 1300); ctx.rotate(-0.04); ctx.scale(p, p);
      ctx.fillStyle = '#ffd400'; ctx.beginPath(); ctx.roundRect(-440, -90, 880, 180, 24); ctx.fill();
      text('۱۰ گلوله برای هر پرنده!', 0, 6, 82, { color: '#111', stroke: false });
      ctx.restore();
    }
  }

  function scene5(lt, t) { // نقل قول
    bg(t, '#141018', '#050407');
    emu(W / 2 + 40, 1500, 2.2, 0.4, -1, '#2a1f2e');
    text('»', 860, 330, 260 * pop(lt, 0.1), { color: SAND, stroke: false });
    const lines = ['اگر لشکری به مقاومت', 'این پرنده‌ها داشتیم،', 'با هر ارتشی در جهان', 'می‌جنگید.'];
    lines.forEach((s, i) => text(s, W / 2, 560 + i * 120, 76 * pop(lt, 0.6 + i * 1.1), { w: 800 }));
    text('سرگرد مِرِدیت، فرماندهٔ عملیات', W / 2, 1120, 46 * pop(lt, 5.2), { w: 600, color: SAND });
  }

  function scene6(lt, t) { // برنده
    bg(t, '#2b1f05', '#0a0702');
    text('جنگ اِموها', W / 2, 330, 120 * pop(lt, 0.1), { color: SAND, glow: 'rgba(255,190,60,0.6)' });
    text('ارتش عقب‌نشینی کرد', W / 2, 500, 64 * pop(lt, 1.0));
    // سکو
    const p = eo(prog(lt, 2.4, 0.8));
    ctx.fillStyle = '#c9a13a';
    ctx.fillRect(W / 2 - 220, 1450 - 260 * p, 440, 260 * p);
    text('۱', W / 2, 1450 - 130 * p, 150 * p, { color: '#3a2a05', stroke: false });
    if (p > 0.6) emu(W / 2 - 20, 1450 - 260 * p - 88, 1.6, Math.sin(lt * 3) * 0.3, 1);
    const w = pop(lt, 3.6, 0.45);
    text('برنده: اِموها!', W / 2, 760, 96 * w, { color: '#ffd400' });
    // کاغذ رنگی
    if (lt > 3.6) for (let i = 0; i < 70; i++) {
      const x = hash(i) * W + Math.sin(lt * 3 + i) * 30;
      const y = ((lt - 3.6) * (300 + hash(i + 1) * 300) + hash(i + 2) * -600);
      if (y < 0 || y > H) continue;
      ctx.save(); ctx.translate(x, y); ctx.rotate(lt * 4 + i);
      ctx.fillStyle = ['#e5383b', '#ffd400', '#4cc9f0', '#80ed99'][i % 4];
      ctx.fillRect(-8, -4, 16, 8); ctx.restore();
    }
  }

  function scene7(lt, t) { // پایان
    bg(t, '#120a14', '#040205');
    text('ماجراهای عجیب', W / 2, 560, 100 * pop(lt, 0.1));
    text('تاریخ', W / 2, 700, 150 * pop(lt, 0.3), { color: SAND });
    const p = pop(lt, 0.8, 0.5);
    ctx.save(); ctx.translate(W / 2, 980); const s = p * (1 + 0.04 * Math.sin(lt * 6)); ctx.scale(s, s);
    ctx.fillStyle = RED; ctx.shadowColor = 'rgba(229,56,59,0.7)'; ctx.shadowBlur = 40;
    ctx.beginPath(); ctx.roundRect(-300, -80, 600, 160, 26); ctx.fill();
    ctx.shadowBlur = 0;
    text('سابسکرایب', 0, 6, 80, { stroke: false, color: '#fff' });
    ctx.restore();
    emu(lerp(-200, W + 200, (lt * 0.25) % 1), 1420, 1.3, lt * 12, 1);
  }

  const SCENES = [scene0, scene1, scene2, scene3, scene4, scene5, scene6, scene7];

  function render(t) {
    t = clamp(t, 0, TOTAL - 1e-4);
    let i = S.length - 1;
    while (i > 0 && t < S[i].start) i--;
    const lt = t - S[i].start;
    ctx.save();
    SCENES[i](lt, t);
    ctx.restore();
    // برچسب ثابت بالا
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.beginPath(); ctx.roundRect(W / 2 - 230, 110, 460, 70, 35); ctx.fill();
    ctx.restore();
    text('اتفاقات عجیب تاریخ', W / 2, 146, 38, { w: 800, color: SAND, stroke: false });
    // گذار: فلش سفید کوتاه آغاز هر صحنه
    const f = 1 - prog(lt, 0, 0.18);
    if (i > 0 && f > 0) { ctx.fillStyle = `rgba(255,240,220,${0.5 * f})`; ctx.fillRect(0, 0, W, H); }
    // نوار پیشرفت
    ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(0, H - 14, W, 14);
    ctx.fillStyle = SAND; ctx.fillRect(0, H - 14, (W * t) / TOTAL, 14);
    // ورود و خروج
    const blk = 1 - Math.min(prog(t, 0, 0.25), 1 - prog(t, TOTAL - 0.5, 0.5));
    if (blk > 0) { ctx.fillStyle = `rgba(0,0,0,${blk})`; ctx.fillRect(0, 0, W, H); }
  }

  window.render = render;
  window.TOTAL = TOTAL;
  window.TIMELINE = { total: TOTAL, scenes: S };
})();
