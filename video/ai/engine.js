// موتور رندر «تاریخ کامل هوش مصنوعی» — هر فریم تابعی از زمان است
(function () {
  const W = 1920, H = 1080;
  const cv = document.getElementById('c');
  cv.width = W; cv.height = H;
  const ctx = cv.getContext('2d');
  // جلوگیری از شعاع منفی در انیمیشن‌های فنری
  { const P = CanvasRenderingContext2D.prototype, arc = P.arc, el = P.ellipse;
    P.arc = function (x, y, r, a0, a1, cc) { return arc.call(this, x, y, Math.max(0, r), a0, a1, cc); };
    P.ellipse = function (x, y, rx, ry, ...rest) { return el.call(this, x, y, Math.max(0, rx), Math.max(0, ry), ...rest); }; }
  const font = (w, s) => `${w} ${s}px Vazirmatn`;
  const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
  const lerp = (a, b, t) => a + (b - a) * t;
  const prog = (t, a, d) => clamp((t - a) / d);
  const eo = (x) => 1 - Math.pow(1 - x, 3);
  const eio = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
  const back = (x) => { const c = 1.7; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); };
  const hash = (n) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
  const fa = (n) => String(n).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[d]);
  const rgba = (hex, a) => { const n = parseInt(hex.slice(1), 16); return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`; };
  const CYAN = '#4fe3ff', INK = '#e8f6ff';
  const pop = (lt, at, d = 0.5) => back(clamp(prog(lt, at, d)));

  // ---------- زمان‌بندی از روی صدای گوینده ----------
  const { scenes } = window.AI;
  const V = window.VOICE || {};
  const GAP = 0.45;
  let T = 0, eraNo = 0, chapter = '';
  const eraCount = scenes.filter((s) => s.type === 'era').length;
  scenes.forEach((s, i) => {
    s.voice = [];
    const say = (k, at) => { const d = V[k] || 2; s.voice.push({ key: k, t: at }); return at + d; };
    if (s.type === 'intro') {
      let e = say(`s${i}_0`, 1.2); e = say(`s${i}_1`, e + 0.8);
      s.l2 = s.voice[1].t; s.dur = e + 1.6;
    } else if (s.type === 'chapter') {
      s.dur = say(`s${i}_0`, 0.9) + 1.3; chapter = s.num + ' · ' + s.title;
    } else if (s.type === 'era') {
      s.no = ++eraNo; s.chapter = chapter;
      let e = say(`s${i}_i`, 0.7);
      s.bt = s.show.map((_, k) => { const at = Math.max(e + GAP, k === 0 ? 3 : 0); e = say(`s${i}_b${k}`, at); return at; });
      s.dur = e + 2.4;
    } else if (s.type === 'outro') {
      let e = say(`s${i}_0`, 1.0); s.l2 = e + 0.6; e = say(`s${i}_1`, s.l2); s.dur = e + 3;
    }
    s.start = T; T += s.dur;
  });
  const TOTAL = T;
  const eras = scenes.filter((s) => s.type === 'era');

  // ---------- متن ----------
  function text(str, x, y, size, o = {}) {
    if (size <= 0.5) return;
    ctx.save();
    ctx.font = font(o.w || 800, size);
    ctx.direction = 'rtl'; ctx.textAlign = o.align || 'center'; ctx.textBaseline = o.base || 'middle';
    if (o.glow) { ctx.shadowColor = o.glow; ctx.shadowBlur = o.blur || 24; }
    ctx.fillStyle = o.color || INK;
    ctx.fillText(str, x, y);
    ctx.restore();
  }
  function wrap(str, maxW, size, w = 400) {
    ctx.font = font(w, size);
    const words = str.split(' '), lines = [];
    let cur = '';
    for (const wd of words) { const tt = cur ? cur + ' ' + wd : wd; if (ctx.measureText(tt).width > maxW && cur) { lines.push(cur); cur = wd; } else cur = tt; }
    if (cur) lines.push(cur);
    return lines;
  }
  function neonGrad(x0, x1, t, c1 = '#7ff0ff', c2 = '#b58cff') {
    const g = ctx.createLinearGradient(x0, 0, x1, 0);
    const p = (t * 0.3) % 1;
    g.addColorStop(0, c2); g.addColorStop(clamp(p), c1); g.addColorStop(1, c2);
    return g;
  }

  // ---------- پس‌زمینه: مدار الکترونیکی ----------
  const TRACES = [];
  for (let i = 0; i < 46; i++) {
    let x = Math.round(hash(i) * 48) * 40, y = Math.round(hash(i + 50) * 27) * 40;
    const pts = [[x, y]];
    for (let k = 0; k < 6; k++) {
      const dir = Math.floor(hash(i * 7 + k) * 4);
      const len = (2 + Math.floor(hash(i * 3 + k) * 6)) * 40;
      if (dir === 0) x += len; else if (dir === 1) x -= len; else if (dir === 2) y += len; else y -= len;
      pts.push([x, y]);
    }
    TRACES.push(pts);
  }
  function background(t, tint = '#0a1630', snow = 0) {
    ctx.fillStyle = '#020409'; ctx.fillRect(0, 0, W, H);
    const g = ctx.createRadialGradient(800, 480, 80, 960, 540, 1300);
    g.addColorStop(0, tint); g.addColorStop(0.6, '#060c1c'); g.addColorStop(1, '#020409');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.save();
    ctx.lineWidth = 2; ctx.lineJoin = 'round';
    TRACES.forEach((pts, i) => {
      ctx.strokeStyle = 'rgba(79,227,255,0.07)';
      ctx.beginPath(); pts.forEach(([x, y], k) => (k ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.stroke();
      ctx.fillStyle = 'rgba(79,227,255,0.15)';
      const [ex, ey] = pts[pts.length - 1]; ctx.beginPath(); ctx.arc(ex, ey, 4, 0, 7); ctx.fill();
      // پالس نور روی مسیر
      const sp = (t * (0.08 + hash(i + 9) * 0.1) + hash(i + 3)) % 1;
      const seg = sp * (pts.length - 1), k = Math.floor(seg), f = seg - k;
      const [ax, ay] = pts[k], [bx, by] = pts[k + 1];
      const px = lerp(ax, bx, f), py = lerp(ay, by, f);
      const rg = ctx.createRadialGradient(px, py, 0, px, py, 18);
      rg.addColorStop(0, snow ? 'rgba(180,220,255,0.6)' : 'rgba(79,227,255,0.7)'); rg.addColorStop(1, 'rgba(79,227,255,0)');
      ctx.fillStyle = rg; ctx.fillRect(px - 18, py - 18, 36, 36);
    });
    ctx.restore();
    if (snow) {
      for (let i = 0; i < 160 * snow; i++) {
        const x = (hash(i) * W + Math.sin(t + i) * 30 + t * 20) % W;
        const y = (hash(i + 1) * H + t * (40 + hash(i + 2) * 60)) % H;
        ctx.fillStyle = `rgba(230,240,255,${0.4 + 0.5 * hash(i + 3)})`;
        ctx.beginPath(); ctx.arc(x, y, 1.5 + hash(i + 4) * 3, 0, 7); ctx.fill();
      }
      ctx.fillStyle = `rgba(150,190,230,${0.08 * snow})`; ctx.fillRect(0, 0, W, H);
    }
  }

  // ---------- تصویرسازی هر دوره (ناحیهٔ چپ، مرکز ۵۸۰,۵۰۰) ----------
  const CX = 580, CY = 500;
  function glowStroke(col, w = 4, blur = 18) { ctx.strokeStyle = col; ctx.lineWidth = w; ctx.shadowColor = col; ctx.shadowBlur = blur; }

  const VIS = {
    talos(lt, t, c) { // غول برنزی
      const a = eo(prog(lt, 0.3, 1.5));
      ctx.save(); ctx.translate(CX, CY + 300); ctx.scale(1.4 * a, 1.4 * a);
      glowStroke(c, 5);
      const body = [[-50, 0], [-40, -170], [-80, -180], [-110, -60], [-90, -55], [-60, -150], [-55, -260], [55, -260], [60, -150], [90, -55], [110, -60], [80, -180], [40, -170], [50, 0], [15, 0], [0, -120], [-15, 0]];
      ctx.fillStyle = rgba(c, 0.18);
      ctx.beginPath(); body.forEach(([x, y], k) => (k ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.arc(0, -305, 42, 0, 7); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#fff3c4'; ctx.shadowBlur = 30;
      const blink = Math.sin(t * 3) > -0.9 ? 1 : 0.2;
      ctx.globalAlpha = blink; ctx.beginPath(); ctx.arc(-15, -310, 6, 0, 7); ctx.arc(15, -310, 6, 0, 7); ctx.fill();
      ctx.restore();
    },
    khwarizmi(lt, t, c) { // فلوچارت الگوریتم
      const boxes = [['آغاز', 0, -260], ['ورودی', 0, -130], ['آیا x > 0؟', 0, 0], ['ادامه', -200, 140], ['پایان', 200, 140]];
      ctx.save(); ctx.translate(CX, CY);
      boxes.forEach(([s, x, y], k) => {
        const p = eo(prog(lt, 0.5 + k * 0.5, 0.6));
        if (p <= 0) return;
        ctx.globalAlpha = p;
        glowStroke(c, 3, 14); ctx.fillStyle = rgba(c, 0.12);
        ctx.beginPath();
        if (k === 2) { ctx.moveTo(x, y - 60); ctx.lineTo(x + 130, y); ctx.lineTo(x, y + 60); ctx.lineTo(x - 130, y); ctx.closePath(); }
        else ctx.roundRect(x - 110, y - 40, 220, 80, k === 0 || k === 4 ? 40 : 10);
        ctx.fill(); ctx.stroke(); ctx.shadowBlur = 0;
        text(s, x, y + 2, 32, { color: INK });
        if (k > 0) {
          const [, px, py] = boxes[k === 4 ? 2 : k - 1];
          ctx.beginPath(); ctx.moveTo(px, py + (k > 2 ? 60 : 40)); ctx.lineTo(x, y - (k === 2 ? 60 : 40)); ctx.strokeStyle = rgba(c, 0.7); ctx.lineWidth = 3; ctx.stroke();
        }
      });
      ctx.restore();
      text('الگوریتم ← Algoritmi', CX, CY + 300, 40 * pop(lt, 4), { color: c, glow: c });
    },
    jazari(lt, t, c) { // چرخ‌دنده‌ها
      const gear = (x, y, r, n, rot) => {
        ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
        glowStroke(c, 4, 16); ctx.fillStyle = rgba(c, 0.12);
        ctx.beginPath();
        for (let k = 0; k < n * 2; k++) { const a = (k * Math.PI) / n, rr = k % 2 ? r : r + 18; ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); ctx.lineTo(Math.cos(a + Math.PI / n) * rr, Math.sin(a + Math.PI / n) * rr); }
        ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.beginPath(); ctx.arc(0, 0, r * 0.3, 0, 7); ctx.stroke();
        ctx.restore();
      };
      const a = eo(prog(lt, 0.2, 1));
      ctx.save(); ctx.globalAlpha = a;
      gear(CX - 120, CY - 40, 140, 12, t * 0.6);
      gear(CX + 140, CY + 90, 90, 8, -t * 0.6 * 140 / 90 + 0.2);
      gear(CX + 100, CY - 200, 60, 6, -t * 0.6 * 140 / 60);
      // قطره‌های آب
      for (let k = 0; k < 6; k++) {
        const p = (t * 0.8 + k / 6) % 1;
        ctx.fillStyle = 'rgba(120,200,255,0.8)'; ctx.beginPath(); ctx.arc(CX - 300, CY - 280 + p * 520, 8, 0, 7); ctx.fill();
      }
      ctx.restore();
    },
    lovelace(lt, t, c) { // کارت پانچ
      ctx.save(); ctx.translate(CX, CY);
      const a = eo(prog(lt, 0.3, 0.8));
      ctx.globalAlpha = a;
      glowStroke(c, 3, 14); ctx.fillStyle = rgba(c, 0.1);
      ctx.beginPath(); ctx.moveTo(-300, -170); ctx.lineTo(270, -170); ctx.lineTo(300, -140); ctx.lineTo(300, 170); ctx.lineTo(-300, 170); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.shadowBlur = 0;
      for (let r = 0; r < 8; r++) for (let k = 0; k < 20; k++) {
        const on = hash(r * 31 + k) > 0.6; const vis = prog(lt, 1 + (r * 20 + k) * 0.012, 0.1);
        if (on && vis > 0) { ctx.fillStyle = rgba('#ffffff', 0.85 * vis); ctx.fillRect(-270 + k * 27, -140 + r * 36, 12, 20); }
      }
      ctx.restore();
      for (let k = 0; k < 5; k++) { // نت موسیقی
        const p = prog(lt, 5 + k * 0.4, 3);
        if (p > 0 && p < 1) text('♪', CX + 250 + k * 30, CY - 220 - p * 200, 50, { color: rgba(c, 1 - p), glow: c });
      }
    },
    turing(lt, t, c) { // آزمون تورینگ: انسان، دیوار، ماشین
      ctx.save();
      const a = eo(prog(lt, 0.3, 1));
      ctx.globalAlpha = a;
      // دیوار
      ctx.fillStyle = 'rgba(255,255,255,0.08)'; ctx.fillRect(CX - 10, CY - 260, 20, 520);
      // انسان (چپ) و ماشین (راست)
      glowStroke(c, 4);
      ctx.beginPath(); ctx.arc(CX - 260, CY - 90, 50, 0, 7); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(CX - 340, CY + 120); ctx.quadraticCurveTo(CX - 260, CY - 30, CX - 180, CY + 120); ctx.stroke();
      ctx.strokeStyle = '#ff7b9c'; ctx.shadowColor = '#ff7b9c';
      ctx.beginPath(); ctx.roundRect(CX + 190, CY - 150, 140, 120, 16); ctx.stroke();
      ctx.beginPath(); ctx.roundRect(CX + 170, CY - 10, 180, 130, 16); ctx.stroke();
      ctx.fillStyle = '#ff7b9c'; ctx.beginPath(); ctx.arc(CX + 230, CY - 95, 10, 0, 7); ctx.arc(CX + 290, CY - 95, 10, 0, 7); ctx.fill();
      ctx.restore();
      text('؟', CX, CY - 320, 110 * pop(lt, 4), { color: '#ffd76a', glow: '#ffd76a' });
      // حباب‌های پیام
      const msgs = [['سلام! تو کی هستی؟', -1, 1.5], ['حدس بزن…', 1, 3]];
      msgs.forEach(([m, side, at]) => {
        const p = pop(lt, at);
        if (p <= 0) return;
        const x = CX + side * 210, y = CY + 230 + (side > 0 ? 70 : 0);
        ctx.save(); ctx.translate(x, y); ctx.scale(p, p);
        ctx.fillStyle = side < 0 ? rgba(c, 0.25) : 'rgba(255,123,156,0.25)'; ctx.beginPath(); ctx.roundRect(-150, -32, 300, 64, 30); ctx.fill();
        text(m, 0, 2, 28); ctx.restore();
      });
    },
    dartmouth(lt, t, c) { // تایپ «Artificial Intelligence»
      const s = 'Artificial Intelligence';
      const n = Math.floor(prog(lt, 1, 2.2) * s.length);
      ctx.save();
      ctx.font = '700 60px monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillStyle = c; ctx.shadowColor = c; ctx.shadowBlur = 25;
      ctx.fillText(s.slice(0, n) + (Math.sin(t * 8) > 0 ? '▌' : ' '), CX, CY - 60);
      ctx.restore();
      text('۱۹۵۶ · تابستان · دارتموث', CX, CY + 60, 40 * pop(lt, 3.4), { color: '#9fb8d8' });
      for (let k = 0; k < 10; k++) { // شرکت‌کنندگان
        const p = pop(lt, 0.3 + k * 0.1);
        const x = CX - 360 + k * 80;
        ctx.save(); ctx.globalAlpha = clamp(p); glowStroke(c, 3, 10);
        ctx.beginPath(); ctx.arc(x, CY + 200, 18 * p, 0, 7); ctx.stroke();
        ctx.beginPath(); ctx.arc(x, CY + 260, 30 * p, Math.PI, 0); ctx.stroke(); ctx.restore();
      }
    },
    perceptron(lt, t, c) { // یک نورون
      const ins = [-180, -60, 60, 180];
      const a = eo(prog(lt, 0.3, 1));
      ctx.save(); ctx.globalAlpha = a;
      ins.forEach((y, k) => {
        const w = 2 + 6 * (0.5 + 0.5 * Math.sin(t * 1.5 + k * 1.7));
        ctx.strokeStyle = rgba(c, 0.6); ctx.lineWidth = w;
        ctx.beginPath(); ctx.moveTo(CX - 300, CY + y); ctx.lineTo(CX, CY); ctx.stroke();
        const p = (t * 0.7 + k * 0.25) % 1; // سیگنال
        ctx.fillStyle = '#fff'; ctx.shadowColor = c; ctx.shadowBlur = 20;
        ctx.beginPath(); ctx.arc(lerp(CX - 300, CX, p), lerp(CY + y, CY, p), 7, 0, 7); ctx.fill(); ctx.shadowBlur = 0;
        glowStroke(c, 3, 10); ctx.fillStyle = '#0a1630';
        ctx.beginPath(); ctx.arc(CX - 300, CY + y, 26, 0, 7); ctx.fill(); ctx.stroke(); ctx.shadowBlur = 0;
        text(`x${fa(k + 1)}`, CX - 300, CY + y + 2, 24);
      });
      glowStroke(c, 5, 30); ctx.fillStyle = rgba(c, 0.25);
      ctx.beginPath(); ctx.arc(CX, CY, 70 + Math.sin(t * 4) * 4, 0, 7); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(CX + 70, CY); ctx.lineTo(CX + 280, CY); ctx.stroke();
      ctx.shadowBlur = 0;
      text('Σ', CX, CY, 70, { color: '#fff' });
      text(Math.sin(t * 2) > 0 ? '۱' : '۰', CX + 320, CY, 60, { color: c, glow: c });
      ctx.restore();
    },
    fuzzy(lt, t, c) { // صفر و یک در برابر طیف
      const a = eo(prog(lt, 0.3, 1));
      ctx.save(); ctx.globalAlpha = a;
      text('منطق کلاسیک', CX, CY - 250, 36, { color: '#9fb8d8' });
      ctx.fillStyle = '#20304a'; ctx.fillRect(CX - 320, CY - 200, 300, 90); ctx.fillStyle = '#e8f6ff'; ctx.fillRect(CX + 20, CY - 200, 300, 90);
      text('۰', CX - 170, CY - 155, 50); text('۱', CX + 170, CY - 155, 50, { color: '#0a1630' });
      const p = prog(lt, 2, 1.5);
      text('منطق فازی', CX, CY + 10, 36 * pop(lt, 2), { color: c });
      const g = ctx.createLinearGradient(CX - 320, 0, CX + 320, 0);
      g.addColorStop(0, '#1a2a6c'); g.addColorStop(0.5, '#f2a65a'); g.addColorStop(1, '#ffe8c2');
      ctx.fillStyle = g; ctx.fillRect(CX - 320, CY + 60, 640 * p, 90);
      const mx = CX - 320 + 640 * (0.5 + 0.45 * Math.sin(t * 1.2));
      if (p >= 1) { ctx.fillStyle = '#fff'; ctx.fillRect(mx - 3, CY + 50, 6, 110); text(`${fa(((mx - CX + 320) / 640).toFixed(2))}`, mx, CY + 200, 34, { color: c }); }
      ctx.restore();
    },
    eliza(lt, t, c) { // ترمینال سبز
      ctx.save();
      const a = eo(prog(lt, 0.2, 0.8)); ctx.globalAlpha = a;
      ctx.fillStyle = '#031208'; ctx.strokeStyle = c; ctx.lineWidth = 4; ctx.shadowColor = c; ctx.shadowBlur = 20;
      ctx.beginPath(); ctx.roundRect(CX - 380, CY - 260, 760, 520, 24); ctx.fill(); ctx.stroke(); ctx.shadowBlur = 0;
      const lines = ['> HELLO. HOW ARE YOU FEELING TODAY?', '< I feel sad.', '> WHY DO YOU FEEL SAD?', '< My mother hates me.', '> TELL ME MORE ABOUT YOUR FAMILY.'];
      ctx.font = '600 28px monospace'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      let shown = prog(lt, 1, 9) * lines.join('').length;
      lines.forEach((l, k) => {
        const s = l.slice(0, Math.max(0, Math.floor(shown)));
        shown -= l.length;
        ctx.fillStyle = l[0] === '>' ? c : '#cfe9d6';
        ctx.fillText(s, CX - 340, CY - 190 + k * 80);
      });
      ctx.restore();
    },
    winter(lt, t, c) { // نمودار سقوط بودجه
      ctx.save();
      glowStroke('#9cc9e8', 3, 8);
      ctx.beginPath(); ctx.moveTo(CX - 330, CY - 220); ctx.lineTo(CX - 330, CY + 220); ctx.lineTo(CX + 340, CY + 220); ctx.stroke();
      const p = prog(lt, 0.5, 4);
      ctx.strokeStyle = '#ff6b6b'; ctx.shadowColor = '#ff6b6b'; ctx.lineWidth = 6;
      ctx.beginPath();
      for (let k = 0; k <= 100 * p; k++) { const u = k / 100; const y = CY - 180 + Math.pow(u, 1.5) * 360 + Math.sin(u * 20) * 10; const x = CX - 330 + u * 660; k ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
      ctx.stroke(); ctx.restore();
      text('بودجه', CX - 260, CY - 250, 32, { color: '#9cc9e8' });
      text('❄', CX + 230, CY - 150, 120 * pop(lt, 2), { color: '#dff1ff', glow: '#9cc9e8' });
    },
    expert(lt, t, c) { // قوانین اگر/آنگاه
      const rules = ['اگر تب بالاست ← آنگاه عفونت محتمل است', 'اگر سرفه + تب ← آنگاه آزمایش خون', 'اگر … ← آنگاه …', 'اگر … ← آنگاه …'];
      rules.forEach((r, k) => {
        const p = eo(prog(lt, 0.4 + k * 0.5, 0.5));
        if (p <= 0) return;
        ctx.save(); ctx.globalAlpha = p * (k > 1 ? 0.5 : 1); ctx.translate((1 - p) * -80, 0);
        ctx.fillStyle = rgba(c, 0.12); ctx.strokeStyle = rgba(c, 0.8); ctx.lineWidth = 2;
        ctx.beginPath(); ctx.roundRect(CX - 360, CY - 230 + k * 120, 720, 90, 12); ctx.fill(); ctx.stroke();
        text(r, CX, CY - 185 + k * 120, 32);
        ctx.restore();
      });
      const crack = prog(lt, 7, 1);
      if (crack > 0) { ctx.save(); glowStroke('#ff6b6b', 5, 14); ctx.beginPath(); ctx.moveTo(CX - 100, CY - 260); ctx.lineTo(CX - 40, CY - 100 * crack); ctx.lineTo(CX - 120, CY + 80 * crack); ctx.lineTo(CX - 20, CY + 260 * crack); ctx.stroke(); ctx.restore(); }
    },
    chess(lt, t, c) { // صفحهٔ شطرنج
      const s = 64, ox = CX - 4 * s, oy = CY - 4 * s;
      const a = eo(prog(lt, 0.2, 0.8));
      ctx.save(); ctx.globalAlpha = a;
      for (let r = 0; r < 8; r++) for (let k = 0; k < 8; k++) { ctx.fillStyle = (r + k) % 2 ? '#1b2a4a' : '#5a7ab8'; ctx.fillRect(ox + k * s, oy + r * s, s, s); }
      ctx.strokeStyle = c; ctx.lineWidth = 4; ctx.shadowColor = c; ctx.shadowBlur = 20; ctx.strokeRect(ox, oy, 8 * s, 8 * s); ctx.shadowBlur = 0;
      const pcs = [['♚', 6, 0, '#fff'], ['♛', 3, 4, '#fff'], ['♜', 0, 7, '#fff'], ['♔', 6, 7, '#111'], ['♞', 2, 5, '#111'], ['♝', 5, 2, '#111']];
      pcs.forEach(([g, x, y, col], k) => {
        let px = x, py = y;
        if (k === 1) { const m = eio(prog(lt, 3, 1)); px = lerp(3, 6, m); py = lerp(4, 1, m); }
        ctx.font = '56px DejaVu Sans'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillStyle = col; ctx.strokeStyle = col === '#111' ? '#fff' : '#000'; ctx.lineWidth = 2;
        ctx.strokeText(g, ox + px * s + s / 2, oy + py * s + s / 2 + 3); ctx.fillText(g, ox + px * s + s / 2, oy + py * s + s / 2 + 3);
      });
      ctx.restore();
      const p = pop(lt, 5);
      text('Deep Blue ۳٫۵ – ۲٫۵ کاسپاروف', CX, CY + 330, 42 * p, { color: c, glow: c });
    },
    quiz(lt, t, c) { // سه تریبون مسابقه
      const names = ['انسان', 'Watson', 'انسان'];
      names.forEach((n, k) => {
        const x = CX - 260 + k * 260, p = eo(prog(lt, 0.3 + k * 0.2, 0.6));
        ctx.save(); ctx.globalAlpha = p;
        ctx.fillStyle = k === 1 ? rgba(c, 0.3) : 'rgba(255,255,255,0.08)'; ctx.strokeStyle = k === 1 ? c : '#5a6a8a'; ctx.lineWidth = 3;
        if (k === 1) { ctx.shadowColor = c; ctx.shadowBlur = 25; }
        ctx.beginPath(); ctx.roundRect(x - 100, CY - 20, 200, 260, 12); ctx.fill(); ctx.stroke(); ctx.shadowBlur = 0;
        text(n, x, CY + 40, 34, { color: k === 1 ? '#fff' : '#9fb8d8' });
        const score = k === 1 ? Math.round(lerp(0, 77147, eo(prog(lt, 2, 3)))) : Math.round(lerp(0, k ? 21600 : 24000, eo(prog(lt, 2, 3))));
        text('$' + score.toLocaleString('en-US'), x, CY + 150, 34, { color: '#ffd76a' });
        ctx.restore();
      });
      if (lt > 0.5) { // آواتار کره‌ای واتسون
        ctx.save(); glowStroke(c, 3, 20);
        for (let k = 0; k < 6; k++) { ctx.beginPath(); ctx.ellipse(CX, CY - 160, 90, 90 * Math.abs(Math.cos(t + k * 0.5)), k * 0.5, 0, 7); ctx.stroke(); }
        ctx.restore();
      }
    },
    deep(lt, t, c) { // شبکهٔ عصبی عمیق
      const layers = [4, 6, 6, 6, 3];
      const pos = layers.map((n, L) => Array.from({ length: n }, (_, k) => [CX - 360 + L * 180, CY + (k - (n - 1) / 2) * 90]));
      const a = eo(prog(lt, 0.3, 1));
      ctx.save(); ctx.globalAlpha = a;
      for (let L = 0; L < layers.length - 1; L++) for (const p1 of pos[L]) for (const p2 of pos[L + 1]) {
        ctx.strokeStyle = rgba(c, 0.15); ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(...p1); ctx.lineTo(...p2); ctx.stroke();
      }
      const wave = (t * 0.6) % 1;
      pos.forEach((ly, L) => ly.forEach(([x, y], k) => {
        const act = Math.max(0, 1 - Math.abs(wave * (layers.length + 1) - 1 - L)) * (0.5 + 0.5 * hash(k + L * 10));
        ctx.fillStyle = rgba(c, 0.2 + 0.8 * act); ctx.shadowColor = c; ctx.shadowBlur = 25 * act;
        ctx.beginPath(); ctx.arc(x, y, 18, 0, 7); ctx.fill();
        ctx.strokeStyle = c; ctx.lineWidth = 2; ctx.stroke();
      }));
      ctx.restore();
      // نمودار خطا
      const p = pop(lt, 6);
      if (p > 0) {
        text('خطا: ۲۶٪ ← ۱۵٪', CX, CY + 330, 46 * p, { color: '#ffd76a', glow: '#ffd76a' });
      }
    },
    go(lt, t, c) { // تختهٔ گو
      const n = 13, s = 40, ox = CX - (n - 1) * s / 2, oy = CY - (n - 1) * s / 2 - 20;
      ctx.save();
      ctx.fillStyle = '#c99a4b'; ctx.fillRect(ox - 30, oy - 30, (n - 1) * s + 60, (n - 1) * s + 60);
      ctx.strokeStyle = '#3a2a10'; ctx.lineWidth = 1.5;
      for (let k = 0; k < n; k++) { ctx.beginPath(); ctx.moveTo(ox, oy + k * s); ctx.lineTo(ox + (n - 1) * s, oy + k * s); ctx.moveTo(ox + k * s, oy); ctx.lineTo(ox + k * s, oy + (n - 1) * s); ctx.stroke(); }
      const stones = Math.floor(prog(lt, 0.5, 6) * 46);
      for (let k = 0; k < stones; k++) {
        const x = Math.floor(hash(k + 5) * n), y = Math.floor(hash(k + 77) * n);
        ctx.fillStyle = k % 2 ? '#f4f1e8' : '#111'; ctx.beginPath(); ctx.arc(ox + x * s, oy + y * s, 17, 0, 7); ctx.fill();
      }
      const m = pop(lt, 7);
      if (m > 0) { // حرکت ۳۷
        const x = ox + 9 * s, y = oy + 3 * s;
        ctx.fillStyle = '#111'; ctx.beginPath(); ctx.arc(x, y, 17 * m, 0, 7); ctx.fill();
        ctx.strokeStyle = '#ff4d6d'; ctx.lineWidth = 4; ctx.shadowColor = '#ff4d6d'; ctx.shadowBlur = 20;
        ctx.beginPath(); ctx.arc(x, y, 30 + Math.sin(t * 6) * 4, 0, 7); ctx.stroke(); ctx.shadowBlur = 0;
        text('حرکت ۳۷', x, y - 60, 34, { color: '#ff8fa3', glow: '#ff4d6d' });
      }
      ctx.restore();
      text('AlphaGo ۴ – ۱ لی سدول', CX, CY + 330, 42 * pop(lt, 2), { color: c, glow: c });
    },
    attention(lt, t, c) { // توجه میان کلمه‌ها
      const words = ['گربه', 'روی', 'فرش', 'خوابید', 'چون', 'خسته', 'بود'];
      const xs = words.map((_, k) => CX + 330 - k * 110);
      const focus = Math.floor(t * 0.5) % words.length;
      words.forEach((wd, k) => {
        const p = pop(lt, 0.3 + k * 0.15);
        ctx.save(); ctx.globalAlpha = clamp(p);
        ctx.fillStyle = k === focus ? rgba(c, 0.35) : 'rgba(255,255,255,0.07)'; ctx.strokeStyle = k === focus ? c : 'rgba(255,255,255,0.3)'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.roundRect(xs[k] - 50, CY + 120, 100, 60, 10); ctx.fill(); ctx.stroke();
        text(wd, xs[k], CY + 151, 28);
        ctx.restore();
      });
      if (lt > 1.6) words.forEach((_, k) => { // کمان‌های توجه
        if (k === focus) return;
        const wgt = 0.15 + 0.85 * hash(k * 13 + focus * 7);
        ctx.save(); ctx.strokeStyle = rgba(c, wgt); ctx.lineWidth = 1 + wgt * 7; ctx.shadowColor = c; ctx.shadowBlur = 12 * wgt;
        const x1 = xs[focus], x2 = xs[k], h = 60 + Math.abs(x1 - x2) * 0.5;
        ctx.beginPath(); ctx.moveTo(x1, CY + 115); ctx.bezierCurveTo(x1, CY + 115 - h, x2, CY + 115 - h, x2, CY + 115); ctx.stroke();
        ctx.restore();
      });
      text('Attention', CX, CY - 220, 64 * pop(lt, 0.5), { color: c, glow: c });
    },
    llm(lt, t, c) { // پیش‌بینی کلمهٔ بعد
      const sent = ['آسمان', 'امروز', 'خیلی'];
      const opts = [['آبی', 0.62], ['ابری', 0.21], ['زیباست', 0.12], ['سبز', 0.05]];
      sent.forEach((wd, k) => text(wd, CX + 220 - k * 160, CY - 180, 52 * pop(lt, 0.3 + k * 0.3)));
      text('…؟', CX - 280, CY - 180, 52 * pop(lt, 1.4), { color: c });
      opts.forEach(([wd, p], k) => {
        const a = eo(prog(lt, 2 + k * 0.3, 0.8));
        const y = CY - 40 + k * 80;
        ctx.fillStyle = 'rgba(255,255,255,0.06)'; ctx.fillRect(CX - 300, y, 560, 54);
        ctx.fillStyle = rgba(c, k === 0 ? 0.8 : 0.4); ctx.fillRect(CX + 260 - 560 * p * a, y, 560 * p * a, 54);
        text(wd, CX + 330, y + 28, 32, { align: 'right' });
        text(`٪${fa(Math.round(p * 100 * a))}`, CX - 350, y + 28, 30, { color: '#ffd76a' });
      });
      const n = Math.round(lerp(0, 175, eo(prog(lt, 5, 2))));
      if (lt > 5) text(`${fa(n)} میلیارد پارامتر`, CX, CY + 340, 46, { color: c, glow: c });
    },
    chat(lt, t, c) { // رابط گفتگو + شمارنده
      ctx.save();
      ctx.fillStyle = '#0f1a20'; ctx.strokeStyle = c; ctx.lineWidth = 3; ctx.shadowColor = c; ctx.shadowBlur = 25;
      ctx.beginPath(); ctx.roundRect(CX - 360, CY - 300, 720, 470, 26); ctx.fill(); ctx.stroke(); ctx.shadowBlur = 0;
      const msgs = [['یک شعر کوتاه دربارهٔ ایران بنویس', 1, 0.8], ['سرزمین آفتاب و کوه و کویر…', 0, 1.8]];
      msgs.forEach(([m, user, at], k) => {
        const p = eo(prog(lt, at, 0.5)); if (p <= 0) return;
        const shown = user ? m : m.slice(0, Math.floor(prog(lt, at, 2) * m.length));
        ctx.globalAlpha = p;
        ctx.fillStyle = user ? '#2b3a44' : rgba(c, 0.3);
        ctx.beginPath(); ctx.roundRect(user ? CX - 40 : CX - 330, CY - 250 + k * 120, 370, 80, 22); ctx.fill();
        text(shown, user ? CX + 145 : CX - 145, CY - 208 + k * 120, 26);
        ctx.globalAlpha = 1;
      });
      ctx.restore();
      const users = lt < 5 ? lerp(0, 1, eo(prog(lt, 3, 2))) : lerp(1, 100, eo(prog(lt, 5, 4)));
      text(`${fa(users < 10 ? users.toFixed(1).replace('.', '٫') : Math.round(users))} میلیون کاربر`, CX, CY + 260, 56, { color: '#fff', glow: c, w: 900 });
    },
    nobel(lt, t, c) { // مدال‌ها
      [['فیزیک', -200, 0.4], ['شیمی', 200, 2.4]].forEach(([n, dx, at]) => {
        const p = pop(lt, at, 0.7); if (p <= 0) return;
        ctx.save(); ctx.translate(CX + dx, CY - 40); ctx.scale(p, p); ctx.rotate(Math.sin(t * 1.5 + dx) * 0.06);
        const g = ctx.createRadialGradient(-30, -30, 10, 0, 0, 150);
        g.addColorStop(0, '#fff3c4'); g.addColorStop(0.5, '#e8c15a'); g.addColorStop(1, '#a87a1e');
        ctx.fillStyle = g; ctx.shadowColor = '#e8c15a'; ctx.shadowBlur = 40;
        ctx.beginPath(); ctx.arc(0, 0, 140, 0, 7); ctx.fill(); ctx.shadowBlur = 0;
        ctx.strokeStyle = '#8a5f12'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(0, 0, 118, 0, 7); ctx.stroke();
        text('نوبل', 0, -20, 48, { color: '#5a3a08', w: 900 });
        text(n, 0, 40, 38, { color: '#5a3a08' });
        ctx.restore();
      });
      text('۲۰۲۴', CX, CY + 260, 64 * pop(lt, 1), { color: c, glow: c });
    },
    future(lt, t, c) { // مغز دیجیتال و پرسش‌ها
      ctx.save(); ctx.translate(CX, CY - 40);
      for (let k = 0; k < 80; k++) {
        const a = hash(k) * 7, r = 60 + hash(k + 1) * 200;
        const x = Math.cos(a + t * 0.2 * (hash(k + 2) - 0.5)) * r * 1.2, y = Math.sin(a) * r * 0.8;
        ctx.fillStyle = rgba(c, 0.4 + 0.6 * Math.abs(Math.sin(t * 2 + k))); ctx.beginPath(); ctx.arc(x, y, 4, 0, 7); ctx.fill();
        if (k % 3 === 0) { const b = (k + 7) % 80; const a2 = hash(b) * 7, r2 = 60 + hash(b + 1) * 200; ctx.strokeStyle = rgba(c, 0.15); ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(Math.cos(a2) * r2 * 1.2, Math.sin(a2) * r2 * 0.8); ctx.stroke(); }
      }
      ctx.restore();
      [['شغل‌ها؟', -260, 4], ['حقیقت؟', 0, 4.6], ['ایمنی؟', 260, 5.2]].forEach(([q, dx, at]) => text(q, CX + dx, CY + 300, 44 * pop(lt, at), { color: '#ffd76a', glow: '#ffd76a' }));
    }
  };

  // ---------- پنل متنی ----------
  const PX = 1840, PW = 760;
  function layout(s) {
    if (s._L) return s._L;
    for (let size = 32; size >= 24; size--) {
      const items = s.show.map((b) => wrap(b, PW - 50, size));
      const lh = size * 1.5, gap = size * 0.6;
      const h = items.reduce((a, l) => a + l.length * lh + gap, 0);
      if (430 + h < 920 || size === 24) return (s._L = { size, lh, gap, items });
    }
  }
  function panel(s, lt) {
    const out = 1 - prog(lt, s.dur - 0.7, 0.7);
    const g = ctx.createLinearGradient(1020, 0, 1920, 0);
    g.addColorStop(0, 'rgba(2,5,14,0)'); g.addColorStop(0.3, 'rgba(2,5,14,0.75)'); g.addColorStop(1, 'rgba(2,5,14,0.9)');
    ctx.fillStyle = g; ctx.fillRect(1020, 0, 900, H);
    ctx.save(); ctx.globalAlpha = out;
    // سال (شمارندهٔ درخشان)
    let a = eo(prog(lt, 0.2, 0.7));
    ctx.globalAlpha = a * out;
    text(s.year, PX, 205, 64, { align: 'right', color: s.color, glow: s.color, blur: 30, w: 900 });
    a = eo(prog(lt, 0.5, 0.8)); ctx.globalAlpha = a * out;
    let ts = 66; ctx.font = font(900, ts);
    while (ctx.measureText(s.title).width > PW && ts > 40) { ts -= 2; ctx.font = font(900, ts); }
    const tw = ctx.measureText(s.title).width;
    ctx.save(); ctx.font = font(900, ts); ctx.direction = 'rtl'; ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
    ctx.fillStyle = neonGrad(PX - tw, PX, lt); ctx.shadowColor = 'rgba(127,240,255,0.4)'; ctx.shadowBlur = 20;
    ctx.fillText(s.title, PX - (1 - a) * 50, 300); ctx.restore();
    // خط
    const lw = PW * eo(prog(lt, 0.9, 0.8));
    ctx.globalAlpha = out; ctx.fillStyle = s.color; ctx.shadowColor = s.color; ctx.shadowBlur = 12;
    ctx.fillRect(PX - lw, 360, lw, 3); ctx.shadowBlur = 0;
    // نکته‌ها
    const L = layout(s); let y = 420;
    s.show.forEach((b, k) => {
      const t0 = s.bt[k], next = k + 1 < s.show.length ? s.bt[k + 1] : s.dur;
      const ba = eo(prog(lt, t0, 0.6)) * out;
      const lines = L.items[k];
      if (ba > 0) {
        ctx.globalAlpha = ba;
        const fresh = clamp(1 - (lt - next + 0.6) / 0.8);
        if (fresh > 0) { ctx.fillStyle = rgba(s.color, 0.16 * fresh); ctx.fillRect(PX - PW, y - 8, PW + 20, lines.length * L.lh + 16); }
        ctx.fillStyle = s.color; ctx.shadowColor = s.color; ctx.shadowBlur = 10;
        ctx.beginPath(); ctx.arc(PX + 4 - (1 - ba) * 40, y + L.size * 0.75, 6, 0, 7); ctx.fill(); ctx.shadowBlur = 0;
        lines.forEach((ln, j) => text(ln, PX - 22 - (1 - ba) * 40, y + L.size * 0.75 + j * L.lh, L.size, { align: 'right', w: 400 }));
      }
      y += lines.length * L.lh + L.gap;
    });
    ctx.restore();
  }

  // ---------- نوار زمان و دماسنج هیجان ----------
  function timeline(t, alpha) {
    if (alpha <= 0) return;
    let pos = 0;
    for (let k = 1; k < eras.length; k++) pos += eio(prog(t, eras[k].start, 1.2));
    const x0 = 1840, x1 = 80, y = 1012;
    ctx.save(); ctx.globalAlpha = alpha;
    const bg = ctx.createLinearGradient(0, 940, 0, H); bg.addColorStop(0, 'rgba(2,4,10,0)'); bg.addColorStop(1, 'rgba(2,4,10,0.85)');
    ctx.fillStyle = bg; ctx.fillRect(0, 940, W, 140);
    ctx.fillStyle = 'rgba(79,227,255,0.2)'; ctx.fillRect(x1, y - 1, x0 - x1, 2);
    const px = lerp(x0, x1, pos / (eras.length - 1));
    ctx.fillStyle = CYAN; ctx.shadowColor = CYAN; ctx.shadowBlur = 12; ctx.fillRect(px, y - 2, x0 - px, 4); ctx.shadowBlur = 0;
    const cur = Math.round(pos);
    eras.forEach((s, k) => {
      const x = lerp(x0, x1, k / (eras.length - 1));
      ctx.fillStyle = k <= pos + 0.01 ? CYAN : 'rgba(160,190,220,0.4)';
      ctx.beginPath(); ctx.arc(x, y, k === cur ? 0 : 4, 0, 7); ctx.fill();
      if (k % 2 === 0 || k === cur) text(s.short, x, y + 36, k === cur ? 22 : 16, { color: k === cur ? '#fff' : 'rgba(200,215,235,0.55)', w: k === cur ? 800 : 500 });
    });
    ctx.fillStyle = '#fff'; ctx.shadowColor = CYAN; ctx.shadowBlur = 20;
    ctx.beginPath(); ctx.arc(px, y, 9, 0, 7); ctx.fill();
    ctx.restore();
  }
  function hypeMeter(t, alpha) {
    if (alpha <= 0) return;
    // مقدار پیوسته
    let v = eras[0].hype;
    eras.forEach((s) => { v = lerp(v, s.hype, eio(prog(t, s.start, 1.5))); });
    const x = 70, y0 = 860, h = 300;
    ctx.save(); ctx.globalAlpha = alpha;
    text('هیجان و سرمایه', x + 10, y0 - h - 40, 20, { color: '#9fb8d8', w: 600 });
    ctx.fillStyle = 'rgba(255,255,255,0.08)'; ctx.beginPath(); ctx.roundRect(x - 12, y0 - h, 24, h, 12); ctx.fill();
    const col = v < 0.3 ? '#9cc9e8' : v < 0.7 ? '#4fe3ff' : '#ff8f5a';
    ctx.fillStyle = col; ctx.shadowColor = col; ctx.shadowBlur = 20;
    ctx.beginPath(); ctx.roundRect(x - 12, y0 - h * v, 24, h * v, 12); ctx.fill();
    ctx.beginPath(); ctx.arc(x, y0 + 14, 22, 0, 7); ctx.fill();
    ctx.restore();
  }

  // ---------- صحنه‌ها ----------
  function era(s, lt, t, prev) {
    background(t, rgba(s.color, 0.22), s.snow === true ? 1 : s.snow || 0);
    // تصویرسازی
    const vin = eo(prog(lt, 0, 0.8)), vout = 1 - prog(lt, s.dur - 0.7, 0.7);
    ctx.save(); ctx.globalAlpha = vin * vout; ctx.translate(0, (1 - vin) * 30);
    VIS[s.vis](lt, t, s.color);
    ctx.restore();
    panel(s, lt);
    // شمارهٔ دوره و بخش
    text(s.chapter, PX, 70, 24, { align: 'right', color: '#9fb8d8', w: 600 });
    text(`رویداد ${fa(s.no)} از ${fa(eraCount)}`, PX, 110, 20, { align: 'right', color: rgba(s.color, 0.9), w: 600 });
  }

  function chapterCard(s, lt, t) {
    background(t, '#0c1a3a');
    const a = eo(prog(lt, 0.2, 0.8)) * (1 - prog(lt, s.dur - 0.6, 0.6));
    ctx.save(); ctx.globalAlpha = a;
    // حلقه‌های چرخان
    ctx.translate(W / 2, 470);
    for (let k = 0; k < 3; k++) { ctx.rotate(t * 0.2 * (k % 2 ? -1 : 1)); glowStroke(rgba('#4fe3ff', 0.5 - k * 0.12), 2, 12); ctx.setLineDash([30 + k * 20, 20]); ctx.beginPath(); ctx.arc(0, 0, 220 + k * 60, 0, 7); ctx.stroke(); }
    ctx.restore();
    ctx.save(); ctx.globalAlpha = a;
    text(s.num, W / 2, 390, 40, { color: CYAN, glow: CYAN });
    ctx.font = font(900, 110); const tw = ctx.measureText(s.title).width;
    ctx.save(); ctx.font = font(900, 110); ctx.direction = 'rtl'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = neonGrad(W / 2 - tw / 2, W / 2 + tw / 2, lt); ctx.shadowColor = 'rgba(127,240,255,0.5)'; ctx.shadowBlur = 30;
    ctx.fillText(s.title, W / 2, 500 + (1 - a) * 30); ctx.restore();
    ctx.restore();
  }

  function intro(s, lt, t) {
    background(t, '#0c1a3a');
    const p = pop(lt, 0.4);
    // رابط گفتگوی آغازین
    ctx.save(); ctx.globalAlpha = eo(prog(lt, 0.3, 0.8)) * (1 - prog(lt, s.l2 - 0.5, 0.6));
    text('۳۰ نوامبر ۲۰۲۲', W / 2, 240, 60 * p, { color: '#10a37f', glow: '#10a37f' });
    text('ChatGPT', W / 2, 400, 170 * pop(lt, 1.6), { color: '#fff', glow: '#10a37f', blur: 50, w: 900 });
    const users = Math.round(lerp(0, 100, eo(prog(lt, 4, 4))));
    text(`${fa(users)} میلیون کاربر در دو ماه`, W / 2, 600, 64 * pop(lt, 4), { color: '#ffd76a', glow: '#ffd76a' });
    ctx.restore();
    // «اما داستان هزاران سال پیش آغاز شد»
    const b = eo(prog(lt, s.l2, 1)) * (1 - prog(lt, s.dur - 0.8, 0.8));
    if (b > 0) {
      ctx.save(); ctx.globalAlpha = b;
      ctx.font = font(900, 140); const tw = ctx.measureText('تاریخ هوش مصنوعی').width;
      ctx.save(); ctx.font = font(900, 140); ctx.direction = 'rtl'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillStyle = neonGrad(W / 2 - tw / 2, W / 2 + tw / 2, lt); ctx.shadowColor = 'rgba(127,240,255,0.6)'; ctx.shadowBlur = 40;
      ctx.fillText('تاریخ هوش مصنوعی', W / 2, 440); ctx.restore();
      text('از رؤیا تا ChatGPT', W / 2, 600, 60, { color: '#b58cff', glow: '#b58cff' });
      ctx.restore();
    }
  }

  function outro(s, lt, t) {
    background(t, '#0c1a3a');
    VIS.future(lt + 10, t, '#7fb2ff');
    ctx.fillStyle = 'rgba(2,4,10,0.6)'; ctx.fillRect(0, 0, W, H);
    const a = eo(prog(lt, 0.5, 1)) * (1 - prog(lt, s.l2 - 0.4, 0.5));
    ctx.save(); ctx.globalAlpha = a;
    text('داستانی که با یک رؤیا آغاز شد،', W / 2, 440, 66, { w: 800 });
    text('هنوز در حال نوشته شدن است', W / 2, 560, 74, { color: CYAN, glow: CYAN, w: 900 });
    ctx.restore();
    const c = pop(lt, s.l2, 0.7) * (1 - prog(lt, s.dur - 1.2, 1.2));
    if (c > 0) {
      text('از همراهی شما سپاسگزاریم', W / 2, 400, 56 * clamp(c));
      ctx.save(); ctx.translate(W / 2, 570); ctx.scale(c * (1 + 0.04 * Math.sin(lt * 5)), c * (1 + 0.04 * Math.sin(lt * 5)));
      ctx.fillStyle = '#e5383b'; ctx.shadowColor = 'rgba(229,56,59,0.7)'; ctx.shadowBlur = 40;
      ctx.beginPath(); ctx.roundRect(-240, -60, 480, 120, 22); ctx.fill(); ctx.shadowBlur = 0;
      text('سابسکرایب کنید', 0, 4, 56, { color: '#fff', w: 900 });
      ctx.restore();
    }
  }

  function render(t) {
    t = clamp(t, 0, TOTAL - 1e-4);
    let i = scenes.length - 1;
    while (i > 0 && t < scenes[i].start) i--;
    const s = scenes[i], prev = scenes[i - 1], lt = t - s.start;
    ctx.save();
    if (s.type === 'intro') intro(s, lt, t);
    else if (s.type === 'chapter') chapterCard(s, lt, t);
    else if (s.type === 'outro') outro(s, lt, t);
    else era(s, lt, t, prev);
    ctx.restore();
    const ta = s.type === 'era' ? 1 : s.type === 'chapter' ? 0.5 : 0;
    const pa = prev ? (prev.type === 'era' ? 1 : prev.type === 'chapter' ? 0.5 : 0) : 0;
    const A = lerp(pa, ta, prog(lt, 0, 0.8));
    timeline(t, A); hypeMeter(t, A);
    text('تاریخ هوش مصنوعی', 90, 70, 26, { align: 'left', color: CYAN, w: 800 });
    // گذار: خط اسکن
    const sc = prog(lt, 0, 0.5);
    if (i > 0 && sc < 1) { ctx.fillStyle = rgba('#4fe3ff', 0.35 * (1 - sc)); ctx.fillRect(0, sc * H - 6, W, 12); ctx.fillStyle = `rgba(0,0,0,${0.5 * (1 - sc)})`; ctx.fillRect(0, 0, W, H); }
    const v = ctx.createRadialGradient(W / 2, H / 2, 500, W / 2, H / 2, 1150);
    v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,0.5)');
    ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
    const blk = 1 - Math.min(prog(t, 0, 0.8), 1 - prog(t, TOTAL - 1, 1));
    if (blk > 0) { ctx.fillStyle = `rgba(0,0,0,${blk})`; ctx.fillRect(0, 0, W, H); }
  }

  window.render = render;
  window.TOTAL = TOTAL;
  window.TIMELINE = scenes.map((s) => ({ type: s.type, title: s.title, year: s.year, start: s.start, dur: s.dur, voice: s.voice, bt: s.bt || [], snow: s.snow || 0, hype: s.hype || 0 }));
})();
