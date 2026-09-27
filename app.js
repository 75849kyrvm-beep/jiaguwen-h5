/* 从古来，向今生 —— H5 interaction logic */
(function () {
  "use strict";
  var slides = Array.prototype.slice.call(document.querySelectorAll(".slide"));
  var cur = 0, animating = false;
  var pager = document.getElementById("pager");
  var dotsNav = document.getElementById("dots");
  var progress = document.getElementById("progress");

  slides.forEach(function (_, i) {
    var d = document.createElement("i");
    d.addEventListener("click", function () { go(i); });
    dotsNav.appendChild(d);
  });
  var dots = Array.prototype.slice.call(dotsNav.children);

  function go(n) {
    if (animating || n < 0 || n >= slides.length || n === cur) return;
    animating = true;
    cur = n;
    pager.style.transform = "translateY(" + (-100 * n) + "vh)";
    dots.forEach(function (d, i) { d.classList.toggle("cur", i === n); });
    dotsNav.classList.toggle("on-dark", slides[n].classList.contains("s-dark"));
    progress.style.width = ((n + 1) / slides.length * 100) + "%";
    setTimeout(function () { animating = false; }, 900);
    if (n === 6) playChat();
    if (n === 7) lightMap();
    if (n === 8) initStars();
  }
  go.mark = function () {};
  window.__go = go;
  var pageParam = new URLSearchParams(location.search).get("page");
  if (pageParam) {
    var pn = parseInt(pageParam, 10);
    if (!isNaN(pn) && pn > 0 && pn <= slides.length) {
      pager.style.transition = "none";
      animating = false;
      cur = 0;
      go(pn - 1);
      animating = false;
    }
  }
  dots[0].classList.add("cur");
  dotsNav.classList.add("on-dark");
  progress.style.width = "10%";

  /* ---- swipe / wheel navigation ---- */
  var startY = null, locked = false;
  function allowNav() { return !locked; }
  window.addEventListener("touchstart", function (e) { startY = e.touches[0].clientY; }, { passive: true });
  window.addEventListener("touchend", function (e) {
    if (startY === null || !allowNav()) return;
    var dy = startY - e.changedTouches[0].clientY;
    if (dy > 60) go(cur + 1); else if (dy < -60) go(cur - 1);
    startY = null;
  }, { passive: true });
  window.addEventListener("wheel", function (e) {
    if (!allowNav()) return;
    if (e.deltaY > 30) go(cur + 1); else if (e.deltaY < -30) go(cur - 1);
  }, { passive: true });
  window.addEventListener("keydown", function (e) {
    if (e.key === "ArrowDown" || e.key === "PageDown") go(cur + 1);
    if (e.key === "ArrowUp" || e.key === "PageUp") go(cur - 1);
  });

  /* ---- sound: synthesized crack + ambience ---- */
  var actx = null, soundOn = false;
  var soundBtn = document.getElementById("soundBtn");
  soundBtn.addEventListener("click", function (e) {
    e.stopPropagation();
    soundOn = !soundOn;
    soundBtn.style.opacity = soundOn ? "1" : ".6";
    if (soundOn && !actx) actx = new (window.AudioContext || window.webkitAudioContext)();
  });
  function crackSound() {
    if (!soundOn || !actx) return;
    var t = actx.currentTime;
    var buf = actx.createBuffer(1, actx.sampleRate * 0.08, actx.sampleRate);
    var data = buf.getChannelData(0);
    for (var i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 2.5);
    var src = actx.createBufferSource(); src.buffer = buf;
    var f = actx.createBiquadFilter(); f.type = "highpass"; f.frequency.value = 1200;
    var g = actx.createGain(); g.gain.setValueAtTime(0.6, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.09);
    src.connect(f); f.connect(g); g.connect(actx.destination); src.start();
  }

  /* ================= 第1页 长按点亮裂纹 ================= */
  var c1 = document.getElementById("crackCanvas"), x1 = c1.getContext("2d");
  var crackPts = [], crackLen = 0, holding = false, lit = false;
  function sizeC1() { c1.width = c1.offsetWidth * 2; c1.height = c1.offsetHeight * 2; }
  sizeC1(); window.addEventListener("resize", sizeC1);
  // generate a jagged main crack path with branches
  function genCrack() {
    crackPts = [];
    var x = c1.width * 0.5, y = c1.height * 0.06;
    crackPts.push([x, y]);
    while (y < c1.height * 0.94) {
      y += 20 + Math.random() * 26;
      x += (Math.random() - 0.5) * 90;
      x = Math.max(c1.width * 0.15, Math.min(c1.width * 0.85, x));
      crackPts.push([x, y]);
    }
  }
  genCrack();
  function drawCrack(prog) {
    x1.clearRect(0, 0, c1.width, c1.height);
    var total = crackPts.length - 1, upto = prog * total;
    x1.lineCap = "round";
    for (var pass = 0; pass < 2; pass++) {
      x1.beginPath();
      x1.strokeStyle = pass === 0 ? "rgba(206,168,78,.25)" : "#cea84e";
      x1.lineWidth = pass === 0 ? 10 : 3;
      for (var i = 0; i <= Math.floor(upto); i++) {
        var pt = crackPts[i];
        if (i === 0) x1.moveTo(pt[0], pt[1]); else x1.lineTo(pt[0], pt[1]);
        // small branch
        if (pass === 1 && i > 0 && i % 3 === 0 && i <= upto) {
          var bx = pt[0] + (Math.sin(i * 7) > 0 ? 1 : -1) * (14 + (i % 5) * 6);
          var by = pt[1] + 12;
          x1.moveTo(pt[0], pt[1]); x1.lineTo(bx, by); x1.moveTo(pt[0], pt[1]);
        }
      }
      x1.stroke();
    }
    // glow head
    var hi = Math.min(Math.floor(upto), total);
    var hp = crackPts[hi];
    var grad = x1.createRadialGradient(hp[0], hp[1], 0, hp[0], hp[1], 60);
    grad.addColorStop(0, "rgba(206,168,78,.9)"); grad.addColorStop(1, "rgba(206,168,78,0)");
    x1.fillStyle = grad;
    x1.beginPath(); x1.arc(hp[0], hp[1], 60, 0, 7); x1.fill();
  }
  drawCrack(0.02);
  var p1 = document.getElementById("p1");
  function pressStart(e) { if (cur !== 0) return; holding = true; e.preventDefault && e.preventDefault(); }
  function pressEnd() { holding = false; }
  p1.addEventListener("touchstart", pressStart, { passive: false });
  p1.addEventListener("mousedown", pressStart);
  window.addEventListener("touchend", pressEnd);
  window.addEventListener("mouseup", pressEnd);
  (function tick1() {
    if (holding && crackLen < 1) {
      crackLen = Math.min(1, crackLen + 0.012);
      drawCrack(crackLen);
      if (crackLen > 0.02 && crackLen < 0.03) crackSound();
      if (crackLen >= 1 && !lit) {
        lit = true;
        p1.classList.add("lit");
        crackSound();
        setTimeout(function () { go(1); }, 2600);
      }
    }
    requestAnimationFrame(tick1);
  })();
  // also allow plain tap to proceed after lit
  document.getElementById("p1hint").addEventListener("click", function () { if (lit) go(1); });

  /* ================= 第2页 刮开药粉 ================= */
  var sc = document.getElementById("scratchCanvas"), sx = sc.getContext("2d");
  var scratched = false;
  function paintPowder() {
    sc.width = sc.offsetWidth * 2; sc.height = sc.offsetHeight * 2;
    sx.globalCompositeOperation = "source-over";
    sx.fillStyle = "#cfc4ae";
    sx.fillRect(0, 0, sc.width, sc.height);
    sx.fillStyle = "rgba(176,164,140,.6)";
    for (var i = 0; i < 260; i++) {
      sx.beginPath();
      sx.arc(Math.random() * sc.width, Math.random() * sc.height, 2 + Math.random() * 5, 0, 7);
      sx.fill();
    }
    sx.fillStyle = "#8a7d66";
    sx.font = (sc.width * 0.07) + "px 'Noto Serif SC'";
    sx.textAlign = "center";
    sx.fillText("药 粉", sc.width / 2, sc.height / 2);
  }
  paintPowder();
  var tip = document.getElementById("scratchTip");
  function scratchAt(cx, cy) {
    var r = sc.getBoundingClientRect();
    sx.globalCompositeOperation = "destination-out";
    sx.beginPath();
    sx.arc((cx - r.left) * 2, (cy - r.top) * 2, 46, 0, 7);
    sx.fill();
    if (!scratched) { scratched = true; tip.style.opacity = "0"; crackSound(); checkScratch(); }
  }
  function checkScratch() {
    var img = sx.getImageData(0, 0, sc.width, sc.height).data;
    var clear = 0, n = 0;
    for (var i = 3; i < img.length; i += 64) { n++; if (img[i] < 40) clear++; }
    if (clear / n > 0.45) {
      sc.style.transition = "opacity .8s"; sc.style.opacity = "0";
      setTimeout(function () { sc.style.pointerEvents = "none"; }, 800);
    }
  }
  var scDown = false;
  sc.addEventListener("touchstart", function (e) { scDown = true; scratchAt(e.touches[0].clientX, e.touches[0].clientY); e.preventDefault(); }, { passive: false });
  sc.addEventListener("touchmove", function (e) { if (scDown) { scratchAt(e.touches[0].clientX, e.touches[0].clientY); e.preventDefault(); } }, { passive: false });
  sc.addEventListener("mousedown", function (e) { scDown = true; scratchAt(e.clientX, e.clientY); });
  window.addEventListener("mousemove", function (e) { if (scDown && cur === 1) scratchAt(e.clientX, e.clientY); });
  window.addEventListener("mouseup", function () { scDown = false; });
  window.addEventListener("touchend", function () { scDown = false; });

  /* ================= 第3页 亲手一卜 ================= */
  var divineBtn = document.getElementById("divineBtn");
  var divineCrack = document.getElementById("divineCrack");
  var divineChar = document.getElementById("divineChar");
  var qInput = document.getElementById("questionInput");
  var answers = ["裂纹向东：此事可期", "纹分三杈：先难后易", "裂而不断：坚持下去", "纹如流水：顺其自然", "裂纹向上：答案在你心里"];
  var holdingDivine = false, divineTimer = null;
  function startDivine(e) {
    e.preventDefault && e.preventDefault();
    if (!qInput.value.trim()) { qInput.focus(); qInput.placeholder = "先写下一个问题，再灼烧"; return; }
    holdingDivine = true;
    divineTimer = setTimeout(fireDivine, 900);
  }
  function endDivine() { holdingDivine = false; clearTimeout(divineTimer); }
  function fireDivine() {
    var d = "M100 20 ";
    var x = 100, y = 20;
    for (var i = 0; i < 6; i++) {
      y += 22 + Math.random() * 8;
      x += (Math.random() - 0.5) * 56;
      x = Math.max(50, Math.min(150, x));
      d += "L" + x.toFixed(0) + " " + y.toFixed(0) + " ";
      if (i % 2 === 1) d += "M" + x.toFixed(0) + " " + y.toFixed(0) + " l" + ((Math.random() - 0.5) * 40).toFixed(0) + " 14 M" + x.toFixed(0) + " " + y.toFixed(0) + " ";
    }
    divineCrack.setAttribute("d", d);
    divineChar.textContent = "卜";
    divineChar.style.opacity = "1";
    crackSound();
    var ans = answers[Math.floor(Math.random() * answers.length)];
    var old = document.querySelector(".divine-answer");
    if (old) old.remove();
    var ap = document.createElement("p");
    ap.className = "divine-answer";
    ap.textContent = "「" + qInput.value.trim() + "」—— " + ans;
    document.getElementById("divineInput").after(ap);
  }
  divineBtn.addEventListener("touchstart", startDivine, { passive: false });
  divineBtn.addEventListener("mousedown", startDivine);
  window.addEventListener("touchend", endDivine);
  window.addEventListener("mouseup", endDivine);

  /* ================= 第4页 字形时间轴 ================= */
  var evoSlider = document.getElementById("evoSlider");
  var evoOracle = document.getElementById("evoOracle");
  var evoText = document.getElementById("evoText");
  var evoEra = document.getElementById("evoEra");
  var stages = [
    { t: null, era: "甲骨文 · 商" },
    { t: "車", era: "金文 · 西周", ff: "'Ma Shan Zheng',cursive", fs: "4.2rem" },
    { t: "車", era: "小篆 · 秦", ff: "'Ma Shan Zheng',cursive", fs: "4.4rem" },
    { t: "車", era: "隶书 · 汉", ff: "'Noto Serif SC',serif", fs: "4.6rem", fw: 400 },
    { t: "車", era: "楷书 · 唐", ff: "'Noto Serif SC',serif", fs: "4.8rem", fw: 900 },
    { t: "车", era: "今天 · 你的输入法", ff: "'Noto Serif SC',serif", fs: "4.8rem", fw: 600 }
  ];
  evoSlider.addEventListener("input", function () {
    var s = stages[+evoSlider.value];
    if (s.t === null) {
      evoOracle.classList.remove("hidden");
      evoText.classList.add("hidden");
    } else {
      evoOracle.classList.add("hidden");
      evoText.classList.remove("hidden");
      evoText.textContent = s.t;
      evoText.style.fontFamily = s.ff;
      evoText.style.fontSize = s.fs;
      evoText.style.fontWeight = s.fw || 400;
    }
    evoEra.textContent = s.era;
    crackSound();
  });

  /* ================= 第5页 认领一个字 ================= */
  var field = document.getElementById("unknownField");
  var unknowns = ["𓂁", "𓃹", "𓄿", "𓆣", "𓇋", "𓈖", "𓉔", "𓊝", "𓋴", "𓌙", "𓍯", "𓎛"];
  // 用自绘 SVG 甲骨风格符号替代不稳定字符
  var glyphs = [];
  for (var g = 0; g < 12; g++) {
    var paths = "";
    var n = 2 + Math.floor(Math.random() * 3);
    for (var k = 0; k < n; k++) {
      var x1p = 10 + Math.random() * 30, y1p = 10 + Math.random() * 30;
      paths += "M" + x1p.toFixed(0) + " " + y1p.toFixed(0) + " L" + (x1p + (Math.random() - 0.5) * 36).toFixed(0) + " " + (y1p + (Math.random() - 0.5) * 36).toFixed(0) + " ";
    }
    if (Math.random() > 0.5) paths += "M" + (20 + Math.random() * 10) + " 15 a8 8 0 1 1 0.1 0 ";
    glyphs.push(paths);
  }
  var claimCount = 30000 + Math.floor(Math.random() * 9000);
  glyphs.forEach(function (d, i) {
    var sp = document.createElement("span");
    sp.className = "ug";
    sp.style.animationDelay = (-Math.random() * 4) + "s";
    sp.innerHTML = '<svg viewBox="0 0 50 50" width="34" height="34"><path d="' + d + '" stroke="currentColor" stroke-width="2.4" fill="none" stroke-linecap="round"/></svg>';
    sp.addEventListener("click", function () {
      document.getElementById("claimGlyph").innerHTML = '<svg viewBox="0 0 50 50" width="110" height="110"><path d="' + d + '" stroke="#cea84e" stroke-width="2" fill="none" stroke-linecap="round"/></svg>';
      document.getElementById("claimText").textContent = "我是第 " + (claimCount++) + " 位想读懂它的人";
      document.getElementById("claimCard").classList.remove("hidden");
      crackSound();
    });
    field.appendChild(sp);
  });
  document.getElementById("claimClose").addEventListener("click", function () {
    document.getElementById("claimCard").classList.add("hidden");
  });

  /* ================= 第6页 甲骨文名字 ================= */
  document.getElementById("nameBtn").addEventListener("click", function () {
    var nm = document.getElementById("nameInput").value.trim();
    if (!nm) { document.getElementById("nameInput").focus(); return; }
    document.getElementById("npName").textContent = nm;
    document.getElementById("namePoster").classList.remove("hidden");
    crackSound();
  });

  /* ================= 第7页 聊天 ================= */
  var chatPlayed = false;
  function playChat() {
    if (chatPlayed) return;
    chatPlayed = true;
    var bubbles = document.querySelectorAll("#chat .bubble");
    bubbles.forEach(function (b, i) {
      setTimeout(function () { b.classList.add("show"); if (soundOn) crackSound(); }, 500 + i * 700);
    });
  }
  var glyphInfo = {
    jia: { svg: '<svg viewBox="0 0 60 60"><g stroke="#cea84e" stroke-width="2.6" fill="none" stroke-linecap="round"><path d="M8 26 L30 8 L52 26"/><path d="M16 26 L16 50 L44 50 L44 26"/><path d="M24 38 q6 -6 12 0 M30 32 L30 46"/></g></svg>', txt: "甲骨文「家」——屋顶之下，养着一头豕（猪）。有房有豕，即为家。" },
    xin: { svg: '<svg viewBox="0 0 60 60"><g stroke="#cea84e" stroke-width="2.6" fill="none" stroke-linecap="round"><path d="M30 48 Q10 32 14 20 Q17 12 25 16 Q29 19 30 24 Q31 19 35 16 Q43 12 46 20 Q50 32 30 48 Z"/></g></svg>', txt: "甲骨文「心」——一颗心脏的形状。三千年，心没换过位置。" },
    che: { svg: '<svg viewBox="0 0 60 60"><g stroke="#cea84e" stroke-width="2.6" fill="none" stroke-linecap="round"><circle cx="16" cy="44" r="8"/><circle cx="44" cy="44" r="8"/><path d="M16 36 L16 18 M44 36 L44 18 M16 27 L44 27 M30 27 L30 8 M24 8 L36 8"/></g></svg>', txt: "甲骨文「车」——两个轮子一根轴，一幅三千年前的新车俯视图。" },
    he: { svg: '<svg viewBox="0 0 60 60"><g stroke="#cea84e" stroke-width="2.6" fill="none" stroke-linecap="round"><path d="M14 14 L14 46 M14 22 L26 22 M14 34 L26 34 M34 18 Q44 12 50 20 L50 44 M38 28 L50 28 M38 38 L50 38"/></g></svg>', txt: "「和」从「龢」而来——排箫众管，各发其声，相和成乐。" }
  };
  var found = 0;
  document.querySelectorAll(".kw").forEach(function (kw) {
    kw.addEventListener("click", function (e) {
      e.stopPropagation();
      var info = glyphInfo[kw.dataset.g];
      if (!kw.dataset.done) { kw.dataset.done = "1"; found++; document.getElementById("p7counter").textContent = "你今天认出了 " + found + " 个甲骨文的子孙"; }
      document.getElementById("glyphPopSvg").innerHTML = info.svg;
      document.getElementById("glyphPopText").textContent = info.txt;
      document.getElementById("glyphPop").classList.remove("hidden");
      crackSound();
    });
  });
  document.getElementById("glyphPop").addEventListener("click", function () {
    this.classList.add("hidden");
  });

  /* ================= 第8页 方言地图 ================= */
  var mapBox = document.getElementById("mapBox");
  var places = [
    { n: "北京", x: 68, y: 26 }, { n: "广州", x: 62, y: 78 }, { n: "成都", x: 34, y: 56 },
    { n: "兰州", x: 40, y: 38 }, { n: "上海", x: 80, y: 52 }, { n: "沈阳", x: 78, y: 16 },
    { n: "西安", x: 50, y: 44 }, { n: "昆明", x: 32, y: 72 }
  ];
  var mapLit = false;
  places.forEach(function (pl) {
    var d = document.createElement("i");
    d.className = "map-dot";
    d.dataset.name = pl.n;
    d.style.left = pl.x + "%"; d.style.top = pl.y + "%";
    mapBox.appendChild(d);
  });
  var center = document.createElement("div");
  center.className = "map-center";
  center.textContent = "和";
  mapBox.appendChild(center);
  function lightMap() {
    if (mapLit) return;
    mapLit = true;
    var ds = mapBox.querySelectorAll(".map-dot");
    ds.forEach(function (d, i) {
      setTimeout(function () { d.classList.add("on", "pulse"); crackSound(); }, 400 + i * 350);
    });
    setTimeout(function () { center.classList.add("show"); }, 400 + ds.length * 350);
  }
  document.getElementById("dialectBtn").addEventListener("click", function () {
    var d = document.createElement("i");
    d.className = "map-dot user on pulse";
    d.dataset.name = "你的家乡";
    d.style.left = (30 + Math.random() * 40) + "%";
    d.style.top = (30 + Math.random() * 40) + "%";
    mapBox.appendChild(d);
    crackSound();
    this.textContent = "已汇入星群 · 谢谢你的乡音";
    this.disabled = true;
  });

  /* ================= 第9页 文字星图 ================= */
  var sc9 = document.getElementById("starCanvas"), sx9 = sc9.getContext("2d");
  var stars = [], userLines = [], drawing = false, lastStar = null, starsInit = false;
  function initStars() {
    if (starsInit) return;
    starsInit = true;
    sc9.width = sc9.offsetWidth * 2; sc9.height = sc9.offsetHeight * 2;
    stars = [];
    for (var i = 0; i < 26; i++) {
      stars.push({
        x: sc9.width * (0.08 + Math.random() * 0.84),
        y: sc9.height * (0.5 + Math.random() * 0.44),
        r: 2 + Math.random() * 3.4,
        born: performance.now() + i * 120,
        tw: Math.random() * 6.28
      });
    }
    requestAnimationFrame(drawStars);
  }
  function nearestStar(px, py) {
    var best = null, bd = 90 * 90;
    stars.forEach(function (s) {
      var dx = s.x - px, dy = s.y - py, dd = dx * dx + dy * dy;
      if (dd < bd) { bd = dd; best = s; }
    });
    return best;
  }
  function canvasPos(e) {
    var r = sc9.getBoundingClientRect();
    var cx = (e.touches ? e.touches[0].clientX : e.clientX) - r.left;
    var cy = (e.touches ? e.touches[0].clientY : e.clientY) - r.top;
    return [cx * 2, cy * 2];
  }
  function starDown(e) {
    if (cur !== 8) return;
    drawing = true;
    var p = canvasPos(e);
    lastStar = nearestStar(p[0], p[1]);
    e.preventDefault && e.preventDefault();
  }
  function starMove(e) {
    if (!drawing) return;
    var p = canvasPos(e);
    var s = nearestStar(p[0], p[1]);
    if (s && s !== lastStar && lastStar) {
      userLines.push([lastStar, s]);
      lastStar = s;
      crackSound();
    }
    e.preventDefault && e.preventDefault();
  }
  function starUp() { drawing = false; lastStar = null; }
  sc9.addEventListener("touchstart", starDown, { passive: false });
  sc9.addEventListener("touchmove", starMove, { passive: false });
  sc9.addEventListener("mousedown", starDown);
  sc9.addEventListener("mousemove", starMove);
  window.addEventListener("touchend", starUp);
  window.addEventListener("mouseup", starUp);
  function drawStars(now) {
    sx9.clearRect(0, 0, sc9.width, sc9.height);
    stars.forEach(function (s) {
      var age = (now - s.born) / 600;
      if (age < 0) return;
      var a = Math.min(1, age) * (0.6 + 0.4 * Math.sin(now / 700 + s.tw));
      sx9.beginPath();
      sx9.fillStyle = "rgba(206,168,78," + a.toFixed(2) + ")";
      sx9.arc(s.x, s.y, s.r, 0, 7);
      sx9.fill();
      sx9.beginPath();
      sx9.fillStyle = "rgba(206,168,78," + (a * 0.15).toFixed(2) + ")";
      sx9.arc(s.x, s.y, s.r * 4, 0, 7);
      sx9.fill();
    });
    sx9.strokeStyle = "rgba(206,168,78,.55)";
    sx9.lineWidth = 1.4;
    userLines.forEach(function (l) {
      sx9.beginPath(); sx9.moveTo(l[0].x, l[0].y); sx9.lineTo(l[1].x, l[1].y); sx9.stroke();
    });
    requestAnimationFrame(drawStars);
  }

  /* ================= 第10页 ================= */
  document.getElementById("replayBtn").addEventListener("click", function () {
    go(0);
  });
})();
