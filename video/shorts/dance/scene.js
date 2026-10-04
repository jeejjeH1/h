// شورت کارتونی «طاعون رقص ۱۵۱۸» — هر فریم تابعی از زمان است
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
  const back = (x) => { const c = 1.9; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); };
  const hash = (n) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
  const fa = (n) => String(Math.round(n)).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[d]);
  const INK = '#2b1d14';
  const pop = (lt, at, d = 0.45) => back(clamp(prog(lt, at, d)));

  // زمان‌بندی از روی صدا
  const V = window.VOICE, S = [];
  let t0 = 0;
  V.forEach((d, i) => {
    const vs = t0 + (i === 0 ? 0.35 : 0.12);
    const dur = (vs - t0) + d + (i === V.length - 1 ? 1.8 : 0.3);
    S.push({ start: t0, dur, voice: vs }); t0 += dur;
  });
  const TOTAL = t0;

  function text(str, x, y, size, opt = {}) {
    if (size <= 0.5) return;
    ctx.save();
    ctx.font = font(opt.w || 900, size);
    ctx.direction = 'rtl'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round';
    ctx.lineWidth = opt.sw || size * 0.2;
    ctx.strokeStyle = opt.sc || INK;
    ctx.strokeText(str, x, y);
    ctx.fillStyle = opt.color || '#fff';
    ctx.fillText(str, x, y);
    ctx.restore();
  }

  // ---------- شخصیت کارتونی ----------
  // o: {skin, cloth, hat:'coif'|'cap'|'doctor'|'none', female, dance(0..1), mood:'happy'|'dazed'|'tired'|'worried'|'surprised', phase, lie}
  function person(x, y, s, t, o = {}) {
    const d = o.dance ?? 1, ph = o.phase || 0;
    const w = t * (o.speed || 7) + ph;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);
    if (o.lie) { ctx.rotate(-Math.PI / 2); ctx.translate(-60, 0); }
    const bounce = -Math.abs(Math.sin(w)) * 26 * d;
    const tilt = Math.sin(w * 0.5) * 0.18 * d;
    ctx.translate(0, bounce);
    ctx.rotate(tilt);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    const limb = (x1, y1, a1, a2, len, col, wd) => {
      const x2 = x1 + Math.sin(a1) * len, y2 = y1 + Math.cos(a1) * len;
      const x3 = x2 + Math.sin(a1 + a2) * len, y3 = y2 + Math.cos(a1 + a2) * len;
      ctx.strokeStyle = INK; ctx.lineWidth = wd + 8;
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.lineTo(x3, y3); ctx.stroke();
      ctx.strokeStyle = col; ctx.lineWidth = wd;
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.lineTo(x3, y3); ctx.stroke();
      return [x3, y3];
    };
    // پاها
    const legA = Math.sin(w) * 0.7 * d, legB = Math.sin(w + Math.PI) * 0.7 * d;
    const shoe = (p) => { ctx.fillStyle = '#3a2618'; ctx.strokeStyle = INK; ctx.lineWidth = 5; ctx.beginPath(); ctx.ellipse(p[0] + 8, p[1] + 4, 18, 10, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); };
    shoe(limb(-18, 60, legA, -Math.abs(legA) * 0.8, 46, o.legs || '#6b4a2e', 16));
    shoe(limb(18, 60, legB, -Math.abs(legB) * 0.8, 46, o.legs || '#6b4a2e', 16));
    // بدن (لباس)
    ctx.fillStyle = o.cloth || '#d9534f'; ctx.strokeStyle = INK; ctx.lineWidth = 6;
    ctx.beginPath();
    if (o.female) { ctx.moveTo(-26, -40); ctx.lineTo(26, -40); ctx.lineTo(52, 78); ctx.quadraticCurveTo(0, 92, -52, 78); ctx.closePath(); }
    else ctx.roundRect(-32, -42, 64, 110, 18);
    ctx.fill(); ctx.stroke();
    if (o.female) { ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.beginPath(); ctx.moveTo(-14, -38); ctx.lineTo(14, -38); ctx.lineTo(24, 40); ctx.lineTo(-24, 40); ctx.fill(); }
    else { ctx.fillStyle = '#5a3a22'; ctx.fillRect(-32, 14, 64, 10); }
    // دست‌ها
    const armUp = d > 0.3;
    const aL = armUp ? Math.PI - 0.5 + Math.sin(w * 1.3) * 0.7 * d : 0.3 + (o.armL || 0);
    const aR = armUp ? -Math.PI + 0.5 + Math.sin(w * 1.3 + 1.5) * 0.7 * d : -0.3 + (o.armR || 0);
    const hand = (p) => { ctx.fillStyle = o.skin || '#f4c99a'; ctx.strokeStyle = INK; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(p[0], p[1], 10, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); };
    hand(limb(-28, -30, -aL, -Math.sin(w * 1.3) * 0.6 * d, 40, o.cloth || '#d9534f', 14));
    hand(limb(28, -30, -aR, Math.sin(w * 1.3) * 0.6 * d, 40, o.cloth || '#d9534f', 14));
    // سر
    ctx.save();
    ctx.translate(0, -88);
    ctx.rotate(Math.sin(w * 0.9) * 0.15 * d);
    ctx.fillStyle = o.skin || '#f4c99a'; ctx.strokeStyle = INK; ctx.lineWidth = 6;
    ctx.beginPath(); ctx.arc(0, 0, 44, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    // کلاه
    if (o.hat === 'coif') {
      ctx.fillStyle = '#f7f1e3';
      ctx.beginPath(); ctx.arc(0, -4, 48, Math.PI * 1.02, Math.PI * 1.98); ctx.lineTo(50, 12); ctx.quadraticCurveTo(40, -20, 0, -26); ctx.quadraticCurveTo(-40, -20, -50, 12); ctx.closePath(); ctx.fill(); ctx.stroke();
    } else if (o.hat === 'cap') {
      ctx.fillStyle = o.hatColor || '#3d5a80';
      ctx.beginPath(); ctx.ellipse(0, -34, 50, 18, -0.15, Math.PI, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(6, -40, 30, 22, -0.2, Math.PI, Math.PI * 2); ctx.fill(); ctx.stroke();
    } else if (o.hat === 'doctor') {
      ctx.fillStyle = '#1e1e24';
      ctx.fillRect(-36, -96, 72, 62); ctx.strokeRect(-36, -96, 72, 62);
      ctx.beginPath(); ctx.ellipse(0, -34, 62, 12, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    }
    // صورت
    const mood = o.mood || 'happy';
    ctx.fillStyle = INK; ctx.strokeStyle = INK; ctx.lineWidth = 5;
    if (mood === 'dazed') {
      for (const ex of [-16, 16]) { ctx.beginPath(); for (let a = 0; a < 12; a += 0.5) { const r = a * 0.9; const px = ex + Math.cos(a + t * 6) * r, py = -4 + Math.sin(a + t * 6) * r; a ? ctx.lineTo(px, py) : ctx.moveTo(px, py); } ctx.lineWidth = 3; ctx.stroke(); }
    } else if (mood === 'tired') {
      for (const ex of [-16, 16]) { ctx.beginPath(); ctx.moveTo(ex - 9, -4); ctx.lineTo(ex + 9, -4); ctx.stroke(); }
    } else {
      const er = mood === 'surprised' ? 8 : 6;
      for (const ex of [-16, 16]) { ctx.beginPath(); ctx.arc(ex, -4, er, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(ex + 2, -6, 2, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = INK; }
    }
    ctx.fillStyle = 'rgba(240,110,110,0.55)';
    for (const cx of [-28, 28]) { ctx.beginPath(); ctx.ellipse(cx, 12, 9, 6, 0, 0, Math.PI * 2); ctx.fill(); }
    ctx.strokeStyle = INK; ctx.lineWidth = 5; ctx.fillStyle = '#8c2f2f';
    if (mood === 'happy') { ctx.beginPath(); ctx.arc(0, 12, 14, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke(); }
    else if (mood === 'surprised' || mood === 'dazed') { ctx.beginPath(); ctx.ellipse(0, 20, 9, 12, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); }
    else if (mood === 'worried') { ctx.beginPath(); ctx.arc(0, 28, 12, 1.15 * Math.PI, 1.85 * Math.PI); ctx.stroke(); }
    else { ctx.beginPath(); ctx.moveTo(-10, 22); ctx.lineTo(10, 22); ctx.stroke(); }
    if (o.sweat) {
      const sp = (t * 1.5 + ph) % 1;
      ctx.fillStyle = '#7cc6ff'; ctx.strokeStyle = INK; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(48, -20 + sp * 30); ctx.quadraticCurveTo(58, -4 + sp * 30, 48, 4 + sp * 30); ctx.quadraticCurveTo(38, -4 + sp * 30, 48, -20 + sp * 30); ctx.fill(); ctx.stroke();
    }
    ctx.restore();
    if (o.stars) { // ستاره‌های گیجی
      for (let i = 0; i < 3; i++) {
        const a = t * 3 + i * 2.1;
        star(Math.cos(a) * 50, -150 + Math.sin(a) * 14, 12, '#ffd23f');
      }
    }
    ctx.restore();
  }

  function star(x, y, r, col) {
    ctx.save(); ctx.translate(x, y);
    ctx.fillStyle = col; ctx.strokeStyle = INK; ctx.lineWidth = 3;
    ctx.beginPath();
    for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.45 : r; ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); }
    ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();
  }

  function bubble(x, y, w, h, str, size, p, tailX = 0) {
    if (p <= 0) return;
    ctx.save(); ctx.translate(x, y); ctx.scale(p, p);
    ctx.fillStyle = '#fff'; ctx.strokeStyle = INK; ctx.lineWidth = 6;
    ctx.beginPath(); ctx.roundRect(-w / 2, -h / 2, w, h, 40); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(tailX - 20, h / 2 - 3); ctx.lineTo(tailX + 10, h / 2 + 50); ctx.lineTo(tailX + 30, h / 2 - 3); ctx.fill();
    ctx.beginPath(); ctx.moveTo(tailX - 20, h / 2); ctx.lineTo(tailX + 10, h / 2 + 50); ctx.lineTo(tailX + 30, h / 2); ctx.stroke();
    text(str, 0, 4, size, { color: INK, sw: 0.01 });
    ctx.restore();
  }

  // ---------- پس‌زمینه‌ها ----------
  function sky(t, top = '#7fd1ff', bot = '#d8f3ff') {
    const g = ctx.createLinearGradient(0, 0, 0, 1300);
    g.addColorStop(0, top); g.addColorStop(1, bot);
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    for (let i = 0; i < 4; i++) { // ابرها
      const x = ((hash(i) * W + t * (15 + i * 8)) % (W + 400)) - 200, y = 230 + i * 120;
      ctx.fillStyle = 'rgba(255,255,255,0.95)'; ctx.strokeStyle = 'rgba(43,29,20,0.25)'; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.arc(x, y, 40, 0, 7); ctx.arc(x + 45, y - 18, 50, 0, 7); ctx.arc(x + 95, y, 38, 0, 7); ctx.fill();
    }
  }

  function cathedral(x, y, s, col = '#c97f6b') { // کلیسای جامع استراسبورگ با یک برج
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    ctx.fillStyle = col; ctx.strokeStyle = INK; ctx.lineWidth = 6;
    ctx.beginPath(); ctx.rect(-90, -260, 180, 260); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(10, -260); ctx.lineTo(10, -420); ctx.lineTo(40, -420); ctx.lineTo(25, -620); ctx.lineTo(10, -420); ctx.lineTo(-20, -420); ctx.lineTo(-20, -260); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#ffe9a8';
    ctx.beginPath(); ctx.arc(0, -170, 34, 0, 7); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-30, 0); ctx.lineTo(-30, -60); ctx.arc(0, -60, 30, Math.PI, 0); ctx.lineTo(30, 0); ctx.fill(); ctx.stroke();
    ctx.restore();
  }

  function house(x, y, w, h, col, roof = '#b5523b') { // خانهٔ چوب‌کاری‌شدهٔ آلزاسی
    ctx.save(); ctx.translate(x, y);
    ctx.strokeStyle = INK; ctx.lineWidth = 6;
    ctx.fillStyle = col; ctx.fillRect(-w / 2, -h, w, h); ctx.strokeRect(-w / 2, -h, w, h);
    ctx.fillStyle = roof;
    ctx.beginPath(); ctx.moveTo(-w / 2 - 18, -h); ctx.lineTo(0, -h - w * 0.75); ctx.lineTo(w / 2 + 18, -h); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = '#5a3a22'; ctx.lineWidth = 8; // تیرهای چوبی
    for (let k = 1; k < 3; k++) { ctx.beginPath(); ctx.moveTo(-w / 2, -h * k / 3); ctx.lineTo(w / 2, -h * k / 3); ctx.stroke(); }
    ctx.beginPath(); ctx.moveTo(-w / 2, -h / 3); ctx.lineTo(0, -h * 2 / 3); ctx.lineTo(w / 2, -h / 3); ctx.stroke();
    ctx.fillStyle = '#ffe08a'; ctx.strokeStyle = INK; ctx.lineWidth = 5;
    for (const wx of [-w / 4, w / 4]) { ctx.fillRect(wx - 18, -h * 0.92, 36, 40); ctx.strokeRect(wx - 18, -h * 0.92, 36, 40); }
    ctx.fillStyle = '#7a4b2a'; ctx.fillRect(-22, -70, 44, 70); ctx.strokeRect(-22, -70, 44, 70);
    ctx.restore();
  }

  function street(t, dark = 0) {
    sky(t);
    cathedral(540, 1020, 1.25);
    const cols = ['#f6d8a8', '#f2a7a0', '#a9d8b8', '#f9e4a1', '#b9c8f2'];
    [[90, 1180, 210, 330], [300, 1150, 200, 300], [790, 1150, 200, 300], [1000, 1180, 210, 340]].forEach(([x, y, w, h], i) => house(x, y, w, h, cols[i % 5]));
    // سنگ‌فرش
    ctx.fillStyle = '#c9b49a'; ctx.fillRect(0, 1170, W, H - 1170);
    ctx.strokeStyle = 'rgba(43,29,20,0.25)'; ctx.lineWidth = 3;
    for (let r = 0; r < 14; r++) for (let c = 0; c < 10; c++) {
      ctx.beginPath(); ctx.ellipse(c * 120 + (r % 2) * 60, 1200 + r * 55, 52, 20, 0, 0, 7); ctx.stroke();
    }
    ctx.strokeStyle = INK; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(0, 1170); ctx.lineTo(W, 1170); ctx.stroke();
    if (dark > 0) { ctx.fillStyle = `rgba(20,20,60,${dark})`; ctx.fillRect(0, 0, W, H); }
  }

  const PAL = [['#d9534f', '#f4c99a'], ['#5b8fd1', '#e8b48a'], ['#57a773', '#f4c99a'], ['#e3a33a', '#d9a47a'], ['#9b6fc9', '#f1c6a0'], ['#e86f9a', '#f4c99a']];
  function crowd(n, t, y0, opts = {}) {
    const people = [];
    for (let i = 0; i < n; i++) {
      const [cl, sk] = PAL[i % PAL.length];
      people.push({ x: 90 + hash(i + 1) * 900, y: y0 + hash(i + 2) * (opts.depth || 380), i, cl, sk, f: hash(i + 3) > 0.45 });
    }
    people.sort((a, b) => a.y - b.y);
    for (const p of people) {
      const sc = 0.55 + (p.y - y0) / (opts.depth || 380) * 0.45;
      person(p.x, p.y, sc * (opts.scale || 1), t, { cloth: p.cl, skin: p.sk, female: p.f, hat: p.f ? 'coif' : 'cap', hatColor: PAL[(p.i + 2) % 6][0], phase: p.i * 1.7, speed: 6 + hash(p.i) * 3, mood: opts.mood || (hash(p.i + 5) > 0.5 ? 'dazed' : 'happy'), sweat: opts.sweat, dance: opts.dance ?? 1 });
    }
  }

  function titleCard(str, y, p, bg = '#ffd23f', col = INK, size = 70) {
    if (p <= 0) return;
    ctx.save(); ctx.translate(W / 2, y); ctx.rotate(-0.03); ctx.scale(p, p);
    ctx.font = font(900, size);
    const tw = ctx.measureText(str).width + 80;
    ctx.fillStyle = bg; ctx.strokeStyle = INK; ctx.lineWidth = 7;
    ctx.beginPath(); ctx.roundRect(-tw / 2, -size * 0.85, tw, size * 1.7, 26); ctx.fill(); ctx.stroke();
    text(str, 0, 4, size, { color: col, sw: 0.01 });
    ctx.restore();
  }

  // ---------- صحنه‌ها ----------
  function s0(lt, t) { // قلاب
    ctx.fillStyle = '#ffcf56'; ctx.fillRect(0, 0, W, H);
    ctx.save(); ctx.translate(W / 2, 1000); ctx.rotate(t * 0.4);
    for (let i = 0; i < 16; i++) { ctx.rotate(Math.PI / 8); ctx.fillStyle = i % 2 ? '#ffb238' : '#ffcf56'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(1600, -200); ctx.lineTo(1600, 200); ctx.fill(); }
    ctx.restore();
    person(W / 2, 1150, 2.6, t, { cloth: '#e85d75', female: true, hat: 'coif', mood: lt > 3 ? 'surprised' : 'happy', speed: 9, sweat: lt > 3 });
    text('یک روز صبح…', W / 2, 330, 96 * pop(lt, 0.2));
    titleCard('شروع به رقص کردید', 470, pop(lt, 1.2));
    text('و نتوانستید بایستید!', W / 2, 640, 92 * pop(lt, 3.6), { color: '#fff' });
    const q = pop(lt, 4.4);
    text('!?', 860, 830, 160 * q, { color: '#e63946' });
  }

  function s1(lt, t) { // آغاز در استراسبورگ
    street(t);
    titleCard('جولای ۱۵۱۸ · استراسبورگ', 300, pop(lt, 0.2), '#fff', INK, 60);
    person(540, 1450, 1.6, t, { cloth: '#e85d75', female: true, hat: 'coif', mood: 'dazed', speed: 8 });
    text('فراو تروفیا', 540, 1730, 60 * pop(lt, 2.4), { color: '#ffd23f' });
    // تماشاگران متعجب
    [[170, 1330, '#5b8fd1'], [910, 1330, '#57a773']].forEach(([x, y, c], i) => {
      person(x, y, 1.0, t, { cloth: c, dance: 0, mood: 'surprised', hat: 'cap', hatColor: '#7a4b2a', armR: i ? 0 : -2.2, armL: i ? 2.2 : 0 });
      bubble(x, y - 290, 120, 110, '؟', 80, pop(lt, 3 + i * 0.6));
    });
  }

  function s2(lt, t) { // روزها و پیوستن دیگران
    // چرخهٔ شب و روز
    const day = lt * 1.1;
    const dark = 0.45 * (0.5 - 0.5 * Math.cos(day * Math.PI * 2));
    street(t, dark);
    const n = Math.min(14, 1 + Math.floor(Math.pow(prog(lt, 1.5, 5), 1.5) * 13));
    crowd(n, t, 1260, { depth: 420 });
    const dn = 1 + Math.floor(prog(lt, 0, 6) * 6);
    titleCard(`روز ${fa(dn)}`, 300, pop(lt, 0.1), '#fff', INK, 72);
    text(`${fa(Math.round(lerp(1, 34, prog(lt, 1.5, 5))))} رقصنده`, W / 2, 460, 74 * pop(lt, 1.5), { color: '#ffd23f' });
    // خورشید/ماه
    const a = day * Math.PI * 2;
    ctx.fillStyle = dark > 0.25 ? '#f4f1de' : '#ffd23f'; ctx.strokeStyle = INK; ctx.lineWidth = 6;
    ctx.beginPath(); ctx.arc(W / 2 + Math.sin(a) * 380, 650 - Math.cos(a) * 120, 50, 0, 7); ctx.fill(); ctx.stroke();
  }

  function s3(lt, t) { // ۴۰۰ نفر
    street(t);
    crowd(38, t, 1180, { depth: 560, scale: 1.0 });
    const n = lerp(34, 400, eo(prog(lt, 0.3, 3)));
    ctx.save(); ctx.translate(W / 2, 470); const p = pop(lt, 0.2); ctx.scale(p, p);
    ctx.fillStyle = '#e63946'; ctx.strokeStyle = INK; ctx.lineWidth = 8;
    ctx.beginPath(); ctx.arc(0, 0, 200, 0, 7); ctx.fill(); ctx.stroke();
    text(fa(n), 0, -20, 150, { color: '#fff' });
    text('نفر!', 0, 100, 60, { color: '#ffd23f' });
    ctx.restore();
  }

  function s4(lt, t) { // پزشکان و نوازندگان
    street(t);
    crowd(10, t, 1350, { depth: 260, scale: 0.9 });
    // صحنهٔ چوبی
    const sp = eo(prog(lt, 4.0, 0.8));
    ctx.fillStyle = '#a0683a'; ctx.strokeStyle = INK; ctx.lineWidth = 6;
    ctx.fillRect(80, 1200 - 60 * sp, 920, 60 * sp); ctx.strokeRect(80, 1200 - 60 * sp, 920, 60 * sp);
    // پزشک
    person(250, 1080, 1.25, t, { cloth: '#1e1e24', dance: 0, mood: 'happy', hat: 'doctor', armR: -2.4 });
    bubble(470, 640, 560, 170, 'درمان: رقص بیشتر!', 58, pop(lt, 0.8), -160);
    // نوازندگان
    if (lt > 4) {
      [[700, '#e3a33a'], [880, '#57a773']].forEach(([x, c], i) => {
        const p = pop(lt, 4.2 + i * 0.4);
        if (p <= 0) return;
        person(x, 1080 - 60 * sp, 1.0 * p, t, { cloth: c, dance: 0.35, speed: 10, hat: 'cap', hatColor: '#9b2226', mood: 'happy' });
        // ساز: طبل
        ctx.save(); ctx.translate(x + (i ? -50 : 50), 1060 - 60 * sp); ctx.scale(p, p);
        ctx.fillStyle = i ? '#f4a261' : '#e9c46a'; ctx.strokeStyle = INK; ctx.lineWidth = 5;
        if (i) { ctx.beginPath(); ctx.ellipse(0, 0, 40, 16, 0, 0, 7); ctx.fill(); ctx.stroke(); ctx.fillRect(-40, 0, 80, 50); ctx.strokeRect(-40, 0, 80, 50); }
        else { ctx.save(); ctx.rotate(-0.6); ctx.fillRect(-6, -60, 12, 90); ctx.strokeRect(-6, -60, 12, 90); ctx.restore(); }
        ctx.restore();
      });
      for (let k = 0; k < 6; k++) { // نت‌های موسیقی
        const p = (lt * 0.6 + k / 6) % 1;
        text(k % 2 ? '♪' : '♫', 800 + Math.sin(k * 2 + lt * 2) * 140, 1020 - p * 260, 64, { color: '#fff' });
      }
    }
  }

  function s5(lt, t) { // خستگی
    street(t, 0.15);
    const people = 10;
    for (let i = 0; i < people; i++) {
      const x = 110 + (i % 5) * 215, y = 1300 + Math.floor(i / 5) * 230;
      const fall = lt > 2.2 + i * 0.35 && i % 3 === 0;
      person(x, y, 0.9, t, { cloth: PAL[i % 6][0], skin: PAL[i % 6][1], female: i % 2 === 0, hat: i % 2 ? 'cap' : 'coif', dance: fall ? 0 : 0.5, speed: 4, mood: fall ? 'tired' : 'worried', sweat: !fall, lie: fall, stars: fall, phase: i });
    }
    titleCard('از پا افتادند…', 360, pop(lt, 0.3), '#3d405b', '#fff', 80);
  }

  function s6(lt, t) { // زیارتگاه در کوهستان
    sky(t, '#ffb88c', '#ffe5c2');
    ctx.fillStyle = '#7fb069'; ctx.strokeStyle = INK; ctx.lineWidth = 7;
    ctx.beginPath(); ctx.moveTo(0, 1500); ctx.quadraticCurveTo(450, 1500, 760, 820); ctx.quadraticCurveTo(900, 760, 1080, 800); ctx.lineTo(1080, H); ctx.lineTo(0, H); ctx.closePath(); ctx.fill(); ctx.stroke();
    // نمازخانهٔ کوچک
    ctx.save(); ctx.translate(880, 800);
    ctx.fillStyle = '#f6e7cb'; ctx.fillRect(-80, -150, 160, 150); ctx.strokeRect(-80, -150, 160, 150);
    ctx.fillStyle = '#b5523b'; ctx.beginPath(); ctx.moveTo(-100, -150); ctx.lineTo(0, -250); ctx.lineTo(100, -150); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#7a4b2a'; ctx.fillRect(-24, -70, 48, 70); ctx.strokeRect(-24, -70, 48, 70);
    ctx.strokeStyle = INK; ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(0, -250); ctx.lineTo(0, -310); ctx.moveTo(-20, -290); ctx.lineTo(20, -290); ctx.stroke();
    ctx.restore();
    // صف رقصندگان بالا رونده
    for (let i = 0; i < 7; i++) {
      const p = clamp(((lt * 0.12) + i * 0.1) % 1);
      const u = p;
      const x = lerp(-60, 760, u), y = lerp(1560, 860, Math.pow(u, 1.3));
      person(x, y, lerp(1.0, 0.55, u), t, { cloth: PAL[i % 6][0], skin: PAL[i % 6][1], female: i % 2 === 0, hat: i % 2 ? 'cap' : 'coif', dance: 0.25, speed: 6, mood: 'happy', phase: i });
    }
    titleCard('سفر به زیارتگاه', 330, pop(lt, 0.3), '#fff', INK, 72);
    text('و ماجرا تمام شد', W / 2, 500, 70 * pop(lt, 3.5), { color: '#fff' });
  }

  function s7(lt, t) { // چرا؟
    ctx.fillStyle = '#2d3047'; ctx.fillRect(0, 0, W, H);
    for (let i = 0; i < 18; i++) {
      const x = hash(i) * W, y = (hash(i + 1) * H + lt * 60 * (0.5 + hash(i + 2))) % H;
      text('؟', x, y, 60 + hash(i + 3) * 70, { color: 'rgba(255,255,255,0.15)', sc: 'rgba(0,0,0,0)' });
    }
    text('چرا؟', W / 2, 360, 170 * pop(lt, 0.2), { color: '#ffd23f' });
    person(W / 2, 1450, 1.7, t, { cloth: '#e85d75', female: true, hat: 'coif', dance: 0, mood: 'worried', armR: -2.6 });
    bubble(310, 760, 420, 160, 'قحطی؟', 66, pop(lt, 3.2), 90);
    bubble(780, 900, 420, 160, 'بیماری؟', 66, pop(lt, 4.4), -90);
    titleCard('هیستری جمعی؟', 1120, pop(lt, 5.6), '#ffd23f', INK, 66);
  }

  function s8(lt, t) { // پایان
    ctx.fillStyle = '#ffcf56'; ctx.fillRect(0, 0, W, H);
    crowd(6, t, 1250, { depth: 250, scale: 1.2, mood: 'happy' });
    text('ماجراهای عجیب', W / 2, 420, 100 * pop(lt, 0.1));
    text('تاریخ', W / 2, 570, 150 * pop(lt, 0.3), { color: '#e63946' });
    const p = pop(lt, 0.8);
    ctx.save(); ctx.translate(W / 2, 830); const sc = p * (1 + 0.05 * Math.sin(lt * 7)); ctx.scale(sc, sc);
    ctx.fillStyle = '#e63946'; ctx.strokeStyle = INK; ctx.lineWidth = 8;
    ctx.beginPath(); ctx.roundRect(-300, -85, 600, 170, 40); ctx.fill(); ctx.stroke();
    text('سابسکرایب', 0, 6, 84, { color: '#fff', sw: 0.01 });
    ctx.restore();
  }

  const SC = [s0, s1, s2, s3, s4, s5, s6, s7, s8];

  function render(t) {
    t = clamp(t, 0, TOTAL - 1e-4);
    let i = S.length - 1;
    while (i > 0 && t < S[i].start) i--;
    const lt = t - S[i].start;
    ctx.save(); SC[i](lt, t); ctx.restore();
    // برچسب بالا
    ctx.save();
    ctx.fillStyle = '#fff'; ctx.strokeStyle = INK; ctx.lineWidth = 5;
    ctx.beginPath(); ctx.roundRect(W / 2 - 220, 110, 440, 76, 38); ctx.fill(); ctx.stroke();
    ctx.restore();
    text('ماجراهای عجیب تاریخ', W / 2, 150, 40, { color: '#e63946', sw: 0.01, w: 900 });
    // گذار: دایرهٔ بازشونده (آیریس کارتونی)
    const ir = prog(lt, 0, 0.45);
    if (i > 0 && ir < 1) {
      ctx.save(); ctx.fillStyle = INK;
      ctx.beginPath(); ctx.rect(0, 0, W, H); ctx.arc(W / 2, H / 2, eo(ir) * 1200, 0, 7, true); ctx.fill('evenodd'); ctx.restore();
    }
    // نوار پیشرفت
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(0, H - 16, W, 16);
    ctx.fillStyle = '#e63946'; ctx.fillRect(0, H - 16, W * t / TOTAL, 16);
    const blk = 1 - Math.min(prog(t, 0, 0.25), 1 - prog(t, TOTAL - 0.5, 0.5));
    if (blk > 0) { ctx.fillStyle = `rgba(0,0,0,${blk})`; ctx.fillRect(0, 0, W, H); }
  }

  window.render = render;
  window.TOTAL = TOTAL;
  window.TIMELINE = { total: TOTAL, scenes: S };
})();
