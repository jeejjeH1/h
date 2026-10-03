// موتور رندر موشن گرافیک: هر فریم تابعی خالص از زمان است (render(t))
(function () {
  const W = 1920, H = 1080;
  const { scenes, total, eraCount, GOLD } = window.HISTORY;
  const FONT = 'Vazirmatn';

  const canvas = document.getElementById('c');
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d');

  // ---------- ابزارها ----------
  const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
  const lerp = (a, b, t) => a + (b - a) * t;
  const prog = (t, a, d) => clamp((t - a) / d);
  const easeOut = (x) => 1 - Math.pow(1 - x, 3);
  const easeInOut = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
  const easeBack = (x) => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); };
  const hash = (n) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
  const rgba = (hex, a) => {
    const n = parseInt(hex.slice(1), 16);
    return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
  };
  const font = (w, s) => `${w} ${s}px ${FONT}`;

  // ---------- داده‌های نقشه ----------
  const topo = window.WORLD;
  const countries = topojson.feature(topo, topo.objects.countries);
  const land = topojson.merge(topo, topo.objects.countries.geometries);
  const borders = topojson.mesh(topo, topo.objects.countries, (a, b) => a !== b);
  const byName = {};
  for (const f of countries.features) byName[f.properties.name] = f;
  const graticule = d3.geoGraticule().step([10, 10])();

  const projection = d3.geoMercator();
  const setCam = (cam) => projection.center(cam.c).scale(cam.s).translate([660, 520]);
  const pathCache = new Map();
  function geoPath2D(key, cam, obj) {
    const k = key + '|' + cam.c[0].toFixed(3) + ',' + cam.c[1].toFixed(3) + ',' + cam.s.toFixed(1);
    let p = pathCache.get(k);
    if (!p) {
      if (pathCache.size > 400) pathCache.clear();
      setCam(cam);
      p = new Path2D(d3.geoPath(projection)(obj) || '');
      pathCache.set(k, p);
    }
    return p;
  }
  function polyPath(poly) {
    const p = new Path2D();
    poly.forEach((ll, i) => { const [x, y] = projection(ll); i ? p.lineTo(x, y) : p.moveTo(x, y); });
    p.closePath();
    return p;
  }
  function regionPath(r, cam) {
    if (r.country) return geoPath2D('c:' + r.country, cam, byName[r.country]);
    setCam(cam);
    return polyPath(r.poly);
  }

  // الگوی گره‌چینی (ستارهٔ هشت‌پر) برای پس‌زمینه
  const pattern = document.createElement('canvas');
  pattern.width = pattern.height = 160;
  {
    const g = pattern.getContext('2d');
    g.strokeStyle = 'rgba(224,179,84,0.55)';
    g.lineWidth = 1.2;
    const star = (cx, cy, r) => {
      g.beginPath();
      for (let i = 0; i < 16; i++) {
        const a = (i * Math.PI) / 8;
        const rr = i % 2 ? r * 0.55 : r;
        const x = cx + Math.cos(a) * rr, y = cy + Math.sin(a) * rr;
        i ? g.lineTo(x, y) : g.moveTo(x, y);
      }
      g.closePath(); g.stroke();
      g.beginPath(); g.arc(cx, cy, r * 0.28, 0, Math.PI * 2); g.stroke();
    };
    star(80, 80, 46);
    for (const [x, y] of [[0, 0], [160, 0], [0, 160], [160, 160]]) star(x, y, 46);
    g.beginPath();
    g.moveTo(80, 34); g.lineTo(80, 0); g.moveTo(80, 126); g.lineTo(80, 160);
    g.moveTo(34, 80); g.lineTo(0, 80); g.moveTo(126, 80); g.lineTo(160, 80);
    g.stroke();
  }

  // ---------- پس‌زمینه ----------
  function drawBackground(t) {
    const g = ctx.createRadialGradient(760, 480, 100, 900, 540, 1300);
    g.addColorStop(0, '#16203a');
    g.addColorStop(0.55, '#0b1226');
    g.addColorStop(1, '#04060e');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    ctx.save();
    ctx.globalAlpha = 0.05;
    const pat = ctx.createPattern(pattern, 'repeat');
    const off = (t * 6) % 160;
    pat.setTransform(new DOMMatrix([1, 0, 0, 1, -off, -off * 0.5]));
    ctx.fillStyle = pat;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }

  function drawParticles(t, alpha = 1) {
    ctx.save();
    for (let i = 0; i < 60; i++) {
      const sp = 6 + hash(i + 3) * 18;
      const x = ((hash(i) * W + t * sp * (hash(i + 9) - 0.3)) % W + W) % W;
      const y = ((hash(i + 1) * H - t * sp) % H + H) % H;
      const r = 1 + hash(i + 2) * 2.6;
      const tw = 0.35 + 0.65 * Math.abs(Math.sin(t * (0.5 + hash(i + 5)) + i));
      ctx.globalAlpha = 0.5 * tw * alpha;
      const g = ctx.createRadialGradient(x, y, 0, x, y, r * 3);
      g.addColorStop(0, 'rgba(255,220,150,1)');
      g.addColorStop(1, 'rgba(255,220,150,0)');
      ctx.fillStyle = g;
      ctx.fillRect(x - r * 3, y - r * 3, r * 6, r * 6);
    }
    ctx.restore();
  }

  // ---------- نقشه ----------
  function drawBaseMap(cam, alpha = 1) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = 'rgba(120,150,200,0.07)';
    ctx.lineWidth = 1;
    ctx.stroke(geoPath2D('grat', cam, graticule));

    const lp = geoPath2D('land', cam, land);
    ctx.shadowColor = 'rgba(90,140,220,0.25)';
    ctx.shadowBlur = 30;
    ctx.fillStyle = '#18233c';
    ctx.fill(lp);
    ctx.shadowBlur = 0;
    ctx.strokeStyle = 'rgba(140,175,230,0.35)';
    ctx.lineWidth = 1.1;
    ctx.stroke(lp);
    ctx.strokeStyle = 'rgba(140,175,230,0.13)';
    ctx.lineWidth = 0.8;
    ctx.stroke(geoPath2D('borders', cam, borders));
    ctx.restore();
  }

  function drawModernIran(cam, alpha) {
    if (alpha <= 0) return;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.setLineDash([6, 6]);
    ctx.strokeStyle = 'rgba(255,230,170,0.55)';
    ctx.lineWidth = 1.5;
    ctx.stroke(geoPath2D('c:Iran', cam, byName.Iran));
    ctx.restore();
  }

  function drawRegion(r, cam, color, reveal, alpha, t) {
    if (alpha <= 0 || reveal <= 0) return;
    const p = regionPath(r, cam);
    setCam(cam);
    const [ox, oy] = projection(r.from || r.at);
    const rad = easeOut(reveal) * 2400;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.clip(geoPath2D('land', cam, land));
    ctx.beginPath(); ctx.arc(ox, oy, rad, 0, Math.PI * 2); ctx.clip();
    // پرشدگی با گرادیان شعاعی از پایتخت
    const g = ctx.createRadialGradient(ox, oy, 0, ox, oy, 900);
    g.addColorStop(0, rgba(color, 0.62));
    g.addColorStop(1, rgba(color, 0.32));
    ctx.fillStyle = g;
    ctx.fill(p);
    // جبههٔ موج گسترش
    if (reveal < 1) {
      ctx.save();
      ctx.clip(p);
      ctx.strokeStyle = rgba('#fff4d6', 0.5 * (1 - reveal));
      ctx.lineWidth = 10;
      ctx.beginPath(); ctx.arc(ox, oy, rad, 0, Math.PI * 2); ctx.stroke();
      ctx.restore();
    }
    const pulse = 0.75 + 0.25 * Math.sin(t * 2.2);
    ctx.shadowColor = color;
    ctx.shadowBlur = 18 * pulse;
    ctx.strokeStyle = rgba(color, 0.95);
    ctx.lineWidth = 2.4;
    ctx.stroke(p);
    ctx.restore();
  }

  function drawRegionLabel(r, cam, color, a) {
    if (!r.label || a <= 0) return;
    setCam(cam);
    const [x, y] = projection(r.at);
    ctx.save();
    ctx.globalAlpha = a;
    ctx.font = font(900, r.size || 40);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.direction = 'rtl';
    ctx.lineWidth = 6;
    ctx.strokeStyle = 'rgba(5,8,18,0.55)';
    ctx.strokeText(r.label, x, y + (1 - a) * 12);
    ctx.fillStyle = 'rgba(255,248,230,0.92)';
    ctx.fillText(r.label, x, y + (1 - a) * 12);
    ctx.restore();
  }

  function drawMarker(m, cam, a, t) {
    if (a <= 0) return;
    setCam(cam);
    const [x, y] = projection(m.ll);
    ctx.save();
    ctx.globalAlpha = a;
    const s = easeBack(clamp(a));
    // حلقهٔ تپنده
    const ph = (t * 0.8 + hash(x) ) % 1;
    ctx.strokeStyle = rgba(GOLD, 0.7 * (1 - ph));
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(x, y, 6 + ph * 22, 0, Math.PI * 2); ctx.stroke();
    if (m.cap) {
      // ستاره برای پایتخت
      ctx.fillStyle = '#fff1c9';
      ctx.shadowColor = GOLD; ctx.shadowBlur = 16;
      ctx.beginPath();
      for (let i = 0; i < 10; i++) {
        const ang = -Math.PI / 2 + (i * Math.PI) / 5;
        const rr = (i % 2 ? 4.5 : 11) * s;
        i ? ctx.lineTo(x + Math.cos(ang) * rr, y + Math.sin(ang) * rr) : ctx.moveTo(x + Math.cos(ang) * rr, y + Math.sin(ang) * rr);
      }
      ctx.closePath(); ctx.fill();
    } else {
      ctx.fillStyle = '#fff1c9';
      ctx.shadowColor = GOLD; ctx.shadowBlur = 12;
      ctx.beginPath(); ctx.arc(x, y, 5.5 * s, 0, Math.PI * 2); ctx.fill();
    }
    ctx.shadowBlur = 0;
    const [dx, dy] = m.o || [-14, -12];
    ctx.font = font(m.cap ? 800 : 600, m.cap ? 27 : 23);
    ctx.direction = 'rtl';
    ctx.textAlign = dx < 0 ? 'right' : 'left';
    if (dx >= 0) ctx.direction = 'ltr';
    ctx.textBaseline = 'alphabetic';
    ctx.lineWidth = 5;
    ctx.strokeStyle = 'rgba(5,8,18,0.8)';
    ctx.strokeText(m.n, x + dx, y + dy);
    ctx.fillStyle = m.cap ? '#ffe7a8' : '#f2ecdf';
    ctx.fillText(m.n, x + dx, y + dy);
    ctx.restore();
  }

  function drawArrow(ar, cam, p, t) {
    if (p <= 0) return;
    setCam(cam);
    const [x0, y0] = projection(ar.from), [x1, y1] = projection(ar.to);
    const mx = (x0 + x1) / 2, my = (y0 + y1) / 2;
    const dx = x1 - x0, dy = y1 - y0;
    const bend = ar.bend || 0.15;
    const cx = mx - dy * bend, cy = my + dx * bend;
    const q = (u) => [
      (1 - u) * (1 - u) * x0 + 2 * (1 - u) * u * cx + u * u * x1,
      (1 - u) * (1 - u) * y0 + 2 * (1 - u) * u * cy + u * u * y1
    ];
    const e = easeInOut(p);
    ctx.save();
    ctx.strokeStyle = 'rgba(255,240,205,0.9)';
    ctx.lineWidth = 4;
    ctx.setLineDash([16, 10]);
    ctx.lineDashOffset = -t * 40;
    ctx.shadowColor = 'rgba(255,200,120,0.8)'; ctx.shadowBlur = 10;
    ctx.beginPath();
    const N = 60;
    for (let i = 0; i <= N * e; i++) {
      const [x, y] = q(i / N);
      i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    }
    ctx.stroke();
    ctx.setLineDash([]);
    // سر پیکان
    const [hx, hy] = q(e), [px, py] = q(Math.max(0, e - 0.02));
    const ang = Math.atan2(hy - py, hx - px);
    ctx.fillStyle = '#fff0cc';
    ctx.beginPath();
    ctx.moveTo(hx + Math.cos(ang) * 16, hy + Math.sin(ang) * 16);
    ctx.lineTo(hx + Math.cos(ang + 2.5) * 16, hy + Math.sin(ang + 2.5) * 16);
    ctx.lineTo(hx + Math.cos(ang - 2.5) * 16, hy + Math.sin(ang - 2.5) * 16);
    ctx.closePath(); ctx.fill();
    ctx.shadowBlur = 0;
    if (ar.label) {
      const [lx, ly] = q(0.5);
      ctx.globalAlpha = prog(p, 0.3, 0.4);
      ctx.font = font(700, 24);
      ctx.textAlign = 'center'; ctx.direction = 'rtl';
      ctx.lineWidth = 5; ctx.strokeStyle = 'rgba(5,8,18,0.85)';
      ctx.strokeText(ar.label, lx, ly - 18);
      ctx.fillStyle = '#ffe2a0';
      ctx.fillText(ar.label, lx, ly - 18);
    }
    ctx.restore();
  }

  // ---------- متن ----------
  function wrap(text, maxW) {
    const words = text.split(' ');
    const lines = [];
    let cur = '';
    for (const w of words) {
      const test = cur ? cur + ' ' + w : w;
      if (ctx.measureText(test).width > maxW && cur) { lines.push(cur); cur = w; } else cur = test;
    }
    if (cur) lines.push(cur);
    return lines;
  }

  function shimmerFill(x0, x1, t, base = GOLD) {
    const g = ctx.createLinearGradient(x0, 0, x1, 0);
    const p = ((t * 0.35) % 1.6) - 0.3;
    g.addColorStop(0, base);
    const st = (o, c) => { const v = p + o; if (v > 0 && v < 1) g.addColorStop(v, c); };
    st(-0.12, base); st(0, '#fff7dc'); st(0.12, base);
    g.addColorStop(1, base);
    return g;
  }

  function diamond(x, y, r, color) {
    ctx.beginPath();
    ctx.moveTo(x, y - r); ctx.lineTo(x + r, y); ctx.lineTo(x, y + r); ctx.lineTo(x - r, y);
    ctx.closePath();
    ctx.fillStyle = color; ctx.fill();
  }

  function ornamentLine(cx, y, halfW, p, alpha = 1) {
    const w = halfW * easeOut(p);
    ctx.save();
    ctx.globalAlpha = alpha;
    const g = ctx.createLinearGradient(cx - halfW, 0, cx + halfW, 0);
    g.addColorStop(0, rgba(GOLD, 0)); g.addColorStop(0.5, rgba(GOLD, 1)); g.addColorStop(1, rgba(GOLD, 0));
    ctx.fillStyle = g;
    ctx.fillRect(cx - w, y - 1, w * 2, 2);
    diamond(cx, y, 7 * p, GOLD);
    diamond(cx - w, y, 4 * p, GOLD);
    diamond(cx + w, y, 4 * p, GOLD);
    ctx.restore();
  }

  // ---------- پنل متنی دوره ----------
  const PX = 1845, PW = 720;

  function bulletLayout(s) {
    if (s._layout) return s._layout;
    const top = 448, bottom = 930;
    for (let size = 31; size >= 22; size--) {
      ctx.font = font(400, size);
      const lh = size * 1.5, gap = size * 0.62;
      const items = s.bullets.map((b) => wrap(b, PW - 50));
      const h = items.reduce((a, l) => a + l.length * lh + gap, 0);
      if (top + h <= bottom || size === 22) {
        s._layout = { size, lh, gap, items, top };
        return s._layout;
      }
    }
  }

  function drawEraPanel(s, lt) {
    const out = 1 - prog(lt, s.dur - 0.8, 0.8);
    // تیره کردن سمت راست برای خوانایی
    const g = ctx.createLinearGradient(1000, 0, 1920, 0);
    g.addColorStop(0, 'rgba(4,7,16,0)');
    g.addColorStop(0.3, 'rgba(4,7,16,0.72)');
    g.addColorStop(1, 'rgba(4,7,16,0.9)');
    ctx.fillStyle = g;
    ctx.fillRect(1000, 0, 920, H);

    ctx.save();
    ctx.direction = 'rtl';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'alphabetic';

    // شمارهٔ بزرگ محو در پس‌زمینه
    const nA = prog(lt, 0.2, 1.2) * out;
    ctx.globalAlpha = 0.07 * nA;
    ctx.font = font(900, 420);
    ctx.fillStyle = s.color;
    ctx.fillText(toFa(s.no), PX + 30, 470 + (1 - nA) * 40);

    // برچسب دوره
    let a = easeOut(prog(lt, 0.3, 0.7)) * out;
    ctx.globalAlpha = a;
    ctx.font = font(700, 24);
    ctx.fillStyle = s.color;
    const tag = `دورهٔ ${toFa(s.no)} از ${toFa(eraCount)}`;
    ctx.fillText(tag, PX - (1 - a) * 40, 200);
    diamond(PX + 18 - (1 - a) * 40, 192, 6, s.color);

    // عنوان
    a = easeOut(prog(lt, 0.5, 0.9)) * out;
    ctx.globalAlpha = a;
    let ts = 78;
    ctx.font = font(900, ts);
    while (ctx.measureText(s.title).width > PW && ts > 50) { ts -= 2; ctx.font = font(900, ts); }
    const tw = ctx.measureText(s.title).width;
    ctx.fillStyle = shimmerFill(PX - tw, PX, lt);
    ctx.shadowColor = 'rgba(224,179,84,0.35)'; ctx.shadowBlur = 24;
    ctx.fillText(s.title, PX - (1 - a) * 60, 295);
    ctx.shadowBlur = 0;

    // تاریخ
    a = easeOut(prog(lt, 0.9, 0.8)) * out;
    ctx.globalAlpha = a;
    ctx.font = font(500, 33);
    ctx.fillStyle = '#e9e2d0';
    ctx.fillText(s.date, PX - (1 - a) * 40, 358);

    // خط تزئینی
    a = prog(lt, 1.1, 0.9);
    ctx.globalAlpha = out;
    const lw = PW * easeOut(a);
    const lg = ctx.createLinearGradient(PX - PW, 0, PX, 0);
    lg.addColorStop(0, rgba(GOLD, 0)); lg.addColorStop(1, rgba(GOLD, 0.9));
    ctx.fillStyle = lg;
    ctx.fillRect(PX - lw, 392, lw, 2);
    if (a > 0) diamond(PX - lw, 393, 5, GOLD);

    // نکته‌ها
    const L = bulletLayout(s);
    let y = L.top;
    s.bullets.forEach((b, i) => {
      const t0 = s.bulletTimes[i];
      const next = i + 1 < s.bullets.length ? s.bulletTimes[i + 1] : s.dur;
      const ba = easeOut(prog(lt, t0, 0.7)) * out;
      const lines = L.items[i];
      const firstY = y + L.size;
      if (ba > 0) {
        ctx.globalAlpha = ba;
        const off = (1 - ba) * 50;
        // نوار برجسته‌سازی برای نکتهٔ تازه
        const fresh = clamp(1 - (lt - next + 0.6) / 0.8) * ba;
        if (fresh > 0) {
          const hg = ctx.createLinearGradient(PX - PW, 0, PX + 20, 0);
          hg.addColorStop(0, rgba(s.color, 0));
          hg.addColorStop(1, rgba(s.color, 0.22 * fresh));
          ctx.fillStyle = hg;
          ctx.fillRect(PX - PW, y - 6, PW + 25, lines.length * L.lh + 12);
        }
        diamond(PX + 6 - off, firstY - L.size * 0.33, 7, GOLD);
        ctx.font = font(400, L.size);
        ctx.fillStyle = '#f4efe3';
        lines.forEach((ln, j) => ctx.fillText(ln, PX - 26 - off, firstY + j * L.lh));
      }
      y += lines.length * L.lh + L.gap;
    });
    ctx.restore();
  }

  function drawStat(s, lt) {
    if (!s.stat) return;
    const a = easeOut(prog(lt, 2.4, 0.9)) * (1 - prog(lt, s.dur - 0.8, 0.8));
    if (a <= 0) return;
    const x = 90, y = 800;
    ctx.save();
    ctx.globalAlpha = a;
    ctx.translate(0, (1 - a) * 30);
    ctx.fillStyle = 'rgba(6,10,22,0.72)';
    ctx.strokeStyle = rgba(GOLD, 0.6);
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.roundRect(x, y, 380, 130, 14); ctx.fill(); ctx.stroke();
    ctx.fillStyle = GOLD;
    ctx.fillRect(x + 376, y + 18, 4, 94);
    ctx.direction = 'rtl'; ctx.textAlign = 'right';
    ctx.font = font(900, 50);
    ctx.fillStyle = shimmerFill(x, x + 380, lt + 1, '#ffd77a');
    ctx.fillText(s.stat.v, x + 350, y + 66);
    ctx.font = font(500, 25);
    ctx.fillStyle = '#e6dfcd';
    ctx.fillText(s.stat.l, x + 350, y + 108);
    ctx.restore();
  }

  // ---------- نوار زمان ----------
  const eras = scenes.filter((s) => s.type === 'era');
  const TL_Y = 1012, TL_X0 = 1840, TL_X1 = 80;
  const tlX = (i) => lerp(TL_X0, TL_X1, i / (eras.length - 1));

  function drawTimeline(t, alpha) {
    if (alpha <= 0) return;
    // موقعیت پیوسته روی نوار با انتقال نرم میان دوره‌ها
    let pos = 0;
    for (let i = 1; i < eras.length; i++) pos += easeInOut(prog(t, eras[i].start, 1.4));
    const cur = Math.round(pos);
    ctx.save();
    ctx.globalAlpha = alpha;
    const bg = ctx.createLinearGradient(0, 940, 0, H);
    bg.addColorStop(0, 'rgba(3,5,12,0)'); bg.addColorStop(1, 'rgba(3,5,12,0.85)');
    ctx.fillStyle = bg; ctx.fillRect(0, 940, W, 140);

    ctx.fillStyle = 'rgba(224,179,84,0.22)';
    ctx.fillRect(TL_X1, TL_Y - 1, TL_X0 - TL_X1, 2);
    const px = lerp(TL_X0, TL_X1, pos / (eras.length - 1));
    const pg = ctx.createLinearGradient(px, 0, TL_X0, 0);
    pg.addColorStop(0, rgba(GOLD, 1)); pg.addColorStop(1, rgba(GOLD, 0.5));
    ctx.fillStyle = pg;
    ctx.fillRect(px, TL_Y - 1.5, TL_X0 - px, 3);

    ctx.textAlign = 'center'; ctx.direction = 'rtl';
    eras.forEach((s, i) => {
      const x = tlX(i);
      const on = i <= pos + 0.01;
      const isCur = i === cur;
      ctx.beginPath(); ctx.arc(x, TL_Y, isCur ? 0 : 4, 0, Math.PI * 2);
      ctx.fillStyle = on ? GOLD : 'rgba(200,190,170,0.45)';
      ctx.fill();
      ctx.font = font(isCur ? 800 : 500, isCur ? 21 : 17);
      ctx.fillStyle = isCur ? '#ffe2a0' : on ? 'rgba(240,225,190,0.75)' : 'rgba(200,195,185,0.45)';
      ctx.fillText(s.short, x, TL_Y + 38);
    });
    // نشانگر
    ctx.shadowColor = GOLD; ctx.shadowBlur = 18;
    diamond(px, TL_Y, 10, '#ffe7a8');
    ctx.shadowBlur = 0;
    ctx.restore();
  }

  function drawHeader(s, t, alpha) {
    if (alpha <= 0) return;
    ctx.save();
    ctx.globalAlpha = alpha * 0.85;
    ctx.direction = 'rtl'; ctx.textAlign = 'right';
    ctx.font = font(800, 26);
    ctx.fillStyle = GOLD;
    ctx.fillText('تاریخ ایران', 1845, 70);
    ctx.font = font(400, 20);
    ctx.fillStyle = 'rgba(235,225,205,0.7)';
    if (s.chapter) ctx.fillText(s.chapter, 1845, 102);
    ctx.restore();
  }

  // ---------- صحنه‌های ویژه ----------
  function drawIntro(s, lt, t) {
    const cam = s.cam;
    drawBaseMap(cam, 0.35 + 0.65 * prog(lt, 0, 1.5));
    // کشیدن مرز ایران
    const p = geoPath2D('c:Iran', cam, byName.Iran);
    const dp = easeInOut(prog(lt, 0.4, 3.2));
    ctx.save();
    ctx.setLineDash([5200 * dp, 6000]);
    ctx.strokeStyle = '#ffd98a';
    ctx.lineWidth = 3;
    ctx.shadowColor = GOLD; ctx.shadowBlur = 22;
    ctx.stroke(p);
    ctx.restore();
    const fa = prog(lt, 2.6, 1.6) * (1 - prog(lt, 6.5, 2));
    ctx.save();
    ctx.globalAlpha = fa * 0.5;
    ctx.fillStyle = rgba(GOLD, 0.55);
    ctx.fill(p);
    ctx.restore();

    // تیره‌سازی و عنوان
    const ta = prog(lt, 3.6, 1.2);
    ctx.fillStyle = `rgba(3,5,12,${0.55 * ta})`;
    ctx.fillRect(0, 0, W, H);
    const out = 1 - prog(lt, s.dur - 1, 1);
    ctx.save();
    ctx.direction = 'rtl'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const e = easeOut(ta);
    ctx.globalAlpha = e * out;
    ctx.translate(W / 2, 470);
    ctx.scale(0.85 + 0.15 * e, 0.85 + 0.15 * e);
    ctx.font = font(900, 170);
    const tw = ctx.measureText('تاریخ ایران').width;
    ctx.fillStyle = shimmerFill(-tw / 2, tw / 2, lt - 3);
    ctx.shadowColor = 'rgba(224,179,84,0.55)'; ctx.shadowBlur = 40;
    ctx.fillText('تاریخ ایران', 0, 0);
    ctx.restore();
    ornamentLine(W / 2, 600, 420, prog(lt, 4.4, 1.2), out);
    ctx.save();
    ctx.direction = 'rtl'; ctx.textAlign = 'center';
    let a = easeOut(prog(lt, 5, 1)) * out;
    ctx.globalAlpha = a;
    ctx.font = font(500, 46);
    ctx.fillStyle = '#f1e9d6';
    ctx.fillText('از نخستین تمدن‌ها تا امروز', W / 2, 680 + (1 - a) * 20);
    a = easeOut(prog(lt, 6.2, 1)) * out;
    ctx.globalAlpha = a;
    ctx.font = font(400, 30);
    ctx.fillStyle = rgba(GOLD, 0.95);
    ctx.fillText(`${toFa(eraCount)} دوره · بیش از ۵۰۰۰ سال تاریخ`, W / 2, 745 + (1 - a) * 20);
    ctx.restore();
  }

  function drawChapter(s, lt, t, prevCam) {
    const cam = lerpCam(prevCam || s.cam, s.cam, easeInOut(prog(lt, 0, 2)));
    drawBaseMap(cam, 0.6);
    drawModernIran(cam, 0.5);
    const a = easeOut(prog(lt, 0.2, 0.9)) * (1 - prog(lt, s.dur - 0.7, 0.7));
    ctx.fillStyle = `rgba(3,5,12,${0.6 * Math.max(a, 0.3)})`;
    ctx.fillRect(0, 0, W, H);
    ctx.save();
    ctx.globalAlpha = a;
    // ستارهٔ چرخان تزئینی
    ctx.translate(W / 2, 430);
    ctx.rotate(lt * 0.15);
    ctx.strokeStyle = rgba(GOLD, 0.35);
    ctx.lineWidth = 1.5;
    for (let k = 0; k < 2; k++) {
      ctx.beginPath();
      for (let i = 0; i < 16; i++) {
        const ang = (i * Math.PI) / 8 + k * Math.PI / 8;
        const rr = (i % 2 ? 150 : 240) * (0.8 + 0.2 * easeOut(a));
        i ? ctx.lineTo(Math.cos(ang) * rr, Math.sin(ang) * rr) : ctx.moveTo(Math.cos(ang) * rr, Math.sin(ang) * rr);
      }
      ctx.closePath(); ctx.stroke();
    }
    ctx.restore();

    ctx.save();
    ctx.direction = 'rtl'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.globalAlpha = a;
    ctx.font = font(700, 36);
    ctx.fillStyle = GOLD;
    ctx.fillText(s.num, W / 2, 360 - (1 - a) * 20);
    const b = easeOut(prog(lt, 0.5, 1)) * (1 - prog(lt, s.dur - 0.7, 0.7));
    ctx.globalAlpha = b;
    ctx.font = font(900, 120);
    const tw = ctx.measureText(s.title).width;
    ctx.fillStyle = shimmerFill(W / 2 - tw / 2, W / 2 + tw / 2, lt);
    ctx.shadowColor = 'rgba(224,179,84,0.5)'; ctx.shadowBlur = 36;
    ctx.fillText(s.title, W / 2, 470 + (1 - b) * 30);
    ctx.shadowBlur = 0;
    const c = easeOut(prog(lt, 1.1, 1)) * (1 - prog(lt, s.dur - 0.7, 0.7));
    ctx.globalAlpha = c;
    ctx.font = font(400, 40);
    ctx.fillStyle = '#efe6d2';
    ctx.fillText(s.sub, W / 2, 640);
    ctx.restore();
    ornamentLine(W / 2, 570, 360, prog(lt, 0.8, 1), a);
  }

  function drawOutro(s, lt, t, prevCam) {
    const cam = lerpCam(prevCam || s.cam, s.cam, easeInOut(prog(lt, 0, 2)));
    drawBaseMap(cam, 0.6);
    const p = geoPath2D('c:Iran', cam, byName.Iran);
    ctx.save();
    ctx.globalAlpha = 0.5 + 0.2 * Math.sin(lt * 1.5);
    ctx.fillStyle = rgba(GOLD, 0.35);
    ctx.fill(p);
    ctx.strokeStyle = '#ffd98a'; ctx.lineWidth = 3;
    ctx.shadowColor = GOLD; ctx.shadowBlur = 24;
    ctx.stroke(p);
    ctx.restore();
    const fade = 1 - prog(lt, s.dur - 1.5, 1.5), Q = s.quoteT, C = s.ctaT;
    ctx.fillStyle = `rgba(3,5,12,${0.62 * prog(lt, 0.5, 1.2)})`;
    ctx.fillRect(0, 0, W, H);

    ctx.save();
    ctx.direction = 'rtl'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const lines = [
      ['ایران؛ سرزمینی که بارها فرو افتاد', 1.0],
      ['و هر بار با فرهنگ و زبانش دوباره برخاست', Math.min(2.4, Q - 1.8)]
    ];
    lines.forEach(([txt, t0], i) => {
      const a = easeOut(prog(lt, t0, 1.1)) * (1 - prog(lt, C - 0.6, 0.8));
      ctx.globalAlpha = a;
      ctx.font = font(800, 62);
      ctx.fillStyle = '#f6efdd';
      ctx.fillText(txt, W / 2, 410 + i * 100 + (1 - a) * 24);
    });
    ornamentLine(W / 2, 590, 380, prog(lt, Q - 0.6, 1), 1 - prog(lt, C - 0.6, 0.8));
    let a = easeOut(prog(lt, Q, 1.2)) * (1 - prog(lt, C - 0.6, 0.8));
    ctx.globalAlpha = a;
    ctx.font = font(500, 44);
    ctx.fillStyle = shimmerFill(W / 2 - 400, W / 2 + 400, lt);
    ctx.fillText('«توانا بود هر که دانا بود / ز دانش دل پیر برنا بود»', W / 2, 680);
    ctx.font = font(400, 30);
    ctx.fillStyle = 'rgba(235,225,205,0.8)';
    ctx.fillText('فردوسی', W / 2, 745);

    // دعوت به سابسکرایب
    const c = easeBack(clamp(prog(lt, C, 0.8))) * fade;
    if (c > 0) {
      ctx.globalAlpha = clamp(c);
      ctx.font = font(700, 46);
      ctx.fillStyle = '#f6efdd';
      ctx.fillText('از تماشای شما سپاسگزاریم', W / 2, 430);
      ctx.save();
      ctx.translate(W / 2, 580);
      ctx.scale(c, c);
      const pulse = 1 + 0.04 * Math.sin(lt * 5);
      ctx.scale(pulse, pulse);
      ctx.fillStyle = '#d62b2b';
      ctx.shadowColor = 'rgba(214,43,43,0.6)'; ctx.shadowBlur = 30;
      ctx.beginPath(); ctx.roundRect(-230, -55, 460, 110, 18); ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#fff';
      ctx.font = font(900, 50);
      ctx.fillText('سابسکرایب کنید', 0, 4);
      ctx.restore();
      const d = easeOut(prog(lt, C + 1, 1)) * fade;
      ctx.globalAlpha = d;
      ctx.font = font(400, 32);
      ctx.fillStyle = 'rgba(240,230,210,0.85)';
      ctx.fillText('لایک کنید و نظرتان را دربارهٔ این ویدیو بنویسید', W / 2, 720);
    }
    ctx.restore();
  }

  function lerpCam(a, b, e) {
    return { c: [lerp(a.c[0], b.c[0], e), lerp(a.c[1], b.c[1], e)], s: Math.exp(lerp(Math.log(a.s), Math.log(b.s), e)) };
  }

  function toFa(n) { return String(n).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[d]); }

  // ---------- صحنهٔ دوره ----------
  function drawEra(s, lt, t, prev) {
    const prevCam = prev ? prev.cam : s.cam;
    const cam = lerpCam(prevCam, s.cam, easeInOut(prog(lt, 0, 1.8)));
    drawBaseMap(cam);
    drawModernIran(cam, 0.8);

    // قلمرو دورهٔ قبل در حال محو شدن
    if (prev && prev.type === 'era') {
      const pa = 1 - prog(lt, 0, 1.0);
      prev.regions.forEach((r) => drawRegion(r, cam, r.color || prev.color, 1, pa, t));
    }
    s.regions.forEach((r, i) => {
      const d = 0.9 + (r.delay || 0);
      const rev = prog(lt, d, 2.6);
      // اگر قلمرو بعدی جایگزین قبلی شود، قبلی محو می‌شود
      let a = 1;
      const next = s.regions[i + 1];
      if (next && next.fadePrev) a = 1 - 0.75 * prog(lt, 0.9 + next.delay, 1.5);
      drawRegion(r, cam, r.color || s.color, rev, a, t);
    });
    if (s.arrows) s.arrows.forEach((ar) => drawArrow(ar, cam, prog(lt, ar.at, 2.4), t));
    const out = 1 - prog(lt, s.dur - 0.6, 0.6);
    s.regions.forEach((r) => drawRegionLabel(r, cam, r.color || s.color, easeOut(prog(lt, 2.4 + (r.delay || 0), 1)) * out));
    s.markers.forEach((m, i) => drawMarker(m, cam, easeOut(prog(lt, m.at != null ? m.at : 2.0 + i * 0.35, 0.6)) * out, t));

    drawEraPanel(s, lt);
    drawStat(s, lt);
  }

  // ---------- رندر اصلی ----------
  function sceneAt(t) {
    for (let i = scenes.length - 1; i >= 0; i--) if (t >= scenes[i].start) return i;
    return 0;
  }

  function render(t) {
    t = clamp(t, 0, total - 1e-4);
    const i = sceneAt(t);
    const s = scenes[i];
    const prev = scenes[i - 1];
    const lt = t - s.start;
    ctx.save();
    drawBackground(t);
    if (s.type === 'intro') drawIntro(s, lt, t);
    else if (s.type === 'chapter') drawChapter(s, lt, t, prev && prev.cam);
    else if (s.type === 'outro') drawOutro(s, lt, t, prev && prev.cam);
    else drawEra(s, lt, t, prev);

    const tlA = s.type === 'era' ? 1 : s.type === 'chapter' ? 0.55 : 0;
    const tlPrevA = prev && prev.type === 'era' ? 1 : prev && prev.type === 'chapter' ? 0.55 : 0;
    drawTimeline(t, lerp(tlPrevA, tlA, prog(lt, 0, 0.8)));
    drawHeader(s, t, s.type === 'era' ? prog(lt, 0, 0.8) : 0);
    drawParticles(t, s.type === 'intro' ? prog(lt, 1, 2) : 1);

    // ورود و خروج کلی (سیاهی ابتدای ویدیو و انتهای آن)
    const fadeIn = prog(t, 0, 1.2), fadeOut = 1 - prog(t, total - 1.2, 1.2);
    const blk = 1 - Math.min(fadeIn, fadeOut);
    if (blk > 0) { ctx.fillStyle = `rgba(0,0,0,${blk})`; ctx.fillRect(0, 0, W, H); }

    // تاریکی حاشیه (وینیت)
    const v = ctx.createRadialGradient(W / 2, H / 2, 500, W / 2, H / 2, 1150);
    v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,0.5)');
    ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }

  // تصویر بندانگشتی یوتیوب
  function renderThumbnail() {
    const cam = { c: [50, 33.5], s: 1050 };
    drawBackground(3);
    drawBaseMap(cam);
    const ach = scenes.find((s) => s.short === 'هخامنشی');
    drawRegion(ach.regions[0], cam, ach.color, 1, 1, 0);
    const v = ctx.createLinearGradient(0, 0, W, 0);
    v.addColorStop(0, 'rgba(3,5,12,0.1)'); v.addColorStop(0.55, 'rgba(3,5,12,0.75)'); v.addColorStop(1, 'rgba(3,5,12,0.92)');
    ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
    ctx.save();
    ctx.direction = 'rtl'; ctx.textAlign = 'right';
    ctx.font = font(900, 210);
    ctx.fillStyle = shimmerFill(900, 1850, 0.9);
    ctx.shadowColor = 'rgba(224,179,84,0.6)'; ctx.shadowBlur = 50;
    ctx.fillText('تاریخ ایران', 1850, 450);
    ctx.shadowBlur = 0;
    ctx.font = font(800, 92);
    ctx.fillStyle = '#ffffff';
    ctx.fillText('۵۰۰۰ سال', 1850, 620);
    ctx.font = font(600, 64);
    ctx.fillStyle = '#f1e7cf';
    ctx.fillText('در یک ویدیو', 1850, 720);
    ctx.restore();
    ctx.save();
    ctx.fillStyle = '#d62b2b';
    ctx.beginPath(); ctx.roundRect(1330, 790, 520, 110, 16); ctx.fill();
    ctx.direction = 'rtl'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = font(900, 56); ctx.fillStyle = '#fff';
    ctx.fillText('از ایلام تا امروز', 1590, 848);
    ctx.restore();
    drawParticles(5, 1);
  }


  // تامنیل نسخهٔ ۲: مرزهای دوره‌های مختلف روی هم + متن درشت
  function renderThumbnail2(variant = 'a') {
    const cam = variant === 'a' ? { c: [55.5, 30.2], s: 1320 } : { c: [53.6, 32.4], s: 2050 };
    const bg = ctx.createRadialGradient(560, 520, 50, 700, 540, 1400);
    bg.addColorStop(0, '#1b2747'); bg.addColorStop(0.6, '#0a1023'); bg.addColorStop(1, '#020309');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
    drawBaseMap(cam, 0.9);
    const era = (short) => scenes.find((x) => x.short === short);
    const iranR = { country: 'Iran', from: [53, 32.5], at: [53, 32.5] };
    if (variant === 'a') {
      const layers = [
        ['هخامنشی', '#f2b632'], ['ساسانی', '#e2483f'], ['صفوی', '#2fc4b2']
      ];
      layers.forEach(([sh, col]) => {
        const r = era(sh).regions[0];
        setCam(cam);
        const p = polyPath(r.poly);
        ctx.save();
        ctx.clip(geoPath2D('land', cam, land));
        ctx.fillStyle = rgba(col, 0.16); ctx.fill(p);
        ctx.shadowColor = col; ctx.shadowBlur = 22;
        ctx.strokeStyle = col; ctx.lineWidth = 5; ctx.stroke(p);
        ctx.restore();
      });
    }
    // ایران امروز درخشان
    const ip = geoPath2D('c:Iran', cam, byName.Iran);
    ctx.save();
    const ig = ctx.createLinearGradient(0, 200, 0, 900);
    ig.addColorStop(0, '#ffe08a'); ig.addColorStop(1, '#d4891e');
    ctx.fillStyle = ig; ctx.globalAlpha = variant === 'a' ? 0.92 : 0.95;
    ctx.shadowColor = 'rgba(255,200,90,0.9)'; ctx.shadowBlur = 60;
    ctx.fill(ip);
    ctx.globalAlpha = 1; ctx.shadowBlur = 0;
    ctx.strokeStyle = '#fff3cf'; ctx.lineWidth = 4; ctx.stroke(ip);
    ctx.restore();

    // تیره‌سازی سمت راست برای متن
    const v = ctx.createLinearGradient(700, 0, W, 0);
    v.addColorStop(0, 'rgba(2,3,9,0)'); v.addColorStop(0.35, 'rgba(2,3,9,0.82)'); v.addColorStop(1, 'rgba(2,3,9,0.95)');
    ctx.fillStyle = v; ctx.fillRect(700, 0, W - 700, H);

    ctx.save();
    ctx.direction = 'rtl'; ctx.textAlign = 'right'; ctx.textBaseline = 'alphabetic';
    const X = 1860;
    ctx.font = font(900, 120);
    ctx.fillStyle = '#ffffff';
    ctx.lineWidth = 14; ctx.strokeStyle = '#000'; ctx.lineJoin = 'round';
    ctx.strokeText('تاریخ کامل', X, 250); ctx.fillText('تاریخ کامل', X, 250);
    ctx.font = font(900, 300);
    const g = ctx.createLinearGradient(0, 300, 0, 560);
    g.addColorStop(0, '#fff1b8'); g.addColorStop(0.5, '#ffc93c'); g.addColorStop(1, '#e08a12');
    ctx.lineWidth = 18; ctx.strokeText('ایران', X, 560);
    ctx.shadowColor = 'rgba(255,190,60,0.7)'; ctx.shadowBlur = 50;
    ctx.fillStyle = g; ctx.fillText('ایران', X, 560);
    ctx.shadowBlur = 0;
    // نوار زرد
    ctx.font = font(900, 76);
    const tx = '۵۰۰۰ سال در ۱۴ دقیقه';
    const tw = ctx.measureText(tx).width;
    ctx.save();
    ctx.translate(X - tw / 2 - 30, 690);
    ctx.rotate(-0.03);
    ctx.fillStyle = '#ffd400';
    ctx.shadowColor = 'rgba(0,0,0,0.6)'; ctx.shadowBlur = 24;
    ctx.fillRect(-tw / 2 - 34, -70, tw + 68, 112);
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#111';
    ctx.textAlign = 'center';
    ctx.fillText(tx, 0, 12);
    ctx.restore();
    if (variant === 'a') {
      // راهنمای رنگ‌ها
      const chips = [['هخامنشیان', '#f2b632'], ['ساسانیان', '#e2483f'], ['صفویان', '#2fc4b2'], ['ایران امروز', '#ffd36a']];
      ctx.font = font(800, 40);
      let cx = X;
      chips.forEach(([n, col]) => {
        const w = ctx.measureText(n).width;
        ctx.fillStyle = col;
        ctx.beginPath(); ctx.arc(cx - 14, 868, 13, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#f4ecd8';
        ctx.fillText(n, cx - 38, 882);
        cx -= w + 90;
      });
    } else {
      ctx.font = font(800, 54);
      ctx.fillStyle = '#f4ecd8';
      ctx.fillText('از ایلام و کوروش تا امروز', X, 880);
    }
    ctx.restore();
    // وینیت
    const vg = ctx.createRadialGradient(W / 2, H / 2, 600, W / 2, H / 2, 1200);
    vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.55)');
    ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
  }
  window.renderThumbnail2 = renderThumbnail2;

  window.render = render;
  window.renderThumbnail = renderThumbnail;
  window.TOTAL = total;
  window.TIMELINE = scenes.map((s) => ({ type: s.type, title: s.title, num: s.num, start: s.start, dur: s.dur, bullets: s.bullets ? s.bullets.length : 0, bulletTimes: s.bulletTimes || [], voice: s.voice || [], date: s.date }));
})();
