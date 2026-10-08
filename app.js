(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var C = { up: "#2ee6a6", down: "#ff5c7a", gold: "#f5b942", blue: "#5aa9ff", text: "#8a97a6", line: "#1b222b" };

  /* ---------------- milestones ---------------- */
  var milestones = [
    { m: "2022-11", tag: "BOOTCAMP", color: C.blue, date: "Nov 2022", side: "ENTRY",
      title: "Started the Full Stack Software Engineering Bootcamp",
      body: "Software Engineering Factory. Six months of building full-stack web apps end to end." },
    { m: "2023-05", tag: "STAR DEV", color: C.gold, gold: true, date: "May 2023", side: "SIGNAL",
      title: "Graduated as a Star Developer",
      body: "Finished the bootcamp as a Star Developer, shipping a full-stack web app." },
    { m: "2023-06", tag: "HIRED", color: C.up, date: "Jun 2023", side: "LONG",
      title: "Joined CoinQuant as Full Stack Developer",
      body: "Built the backtesting platform UI from scratch and the Python REST APIs behind it, turning a backend-only tool into a product the team uses. Also shipped a React Native + Firebase mobile app." },
    { m: "2024-08", tag: "PROMO", color: C.up, date: "Aug 2024", side: "ADD",
      title: "Promoted to Backend Developer",
      body: "Led the move of internal Python microservices from Bazel to Poetry, and standardised the team's local development workflow." },
    { m: "2025-09", tag: "LEAD", color: C.up, date: "Sep 2025", side: "ADD",
      title: "Team Lead · Algorithmic Trader",
      body: "Leading 5 engineers. Architected an event-driven backtesting platform on AWS Lambda + SQS: 800+ concurrent jobs, zero production failures. Added a slippage model and multi-position scaling." },
    { m: "2026-03", tag: "CERT", color: C.gold, gold: true, date: "Mar 2026", side: "SIGNAL",
      title: "Zapier Academy: AI Builder Path",
      body: "Completed the AI Builder certification: multi-step automations with AI steps, webhooks, scheduling and Zapier Tables." },
    { m: "2026-08", tag: "CHART", color: C.up, date: "Apr to Aug 2026", side: "ADD",
      title: "Shipped the interactive backtest chart",
      body: "Next.js + TypeScript on TradingView Lightweight Charts: trade markers, indicator panes, win/loss filters and lazy-loaded data. The same library drawing the chart above." },
    { m: "2026-09", tag: "CERT", color: C.gold, gold: true, date: "Sep 2026", side: "SIGNAL",
      title: "Applied AI Engineering Workshop",
      body: "Completed Software Engineering Factory's applied AI engineering program: tool calling, RAG, structured outputs, evaluations and human approval gates." }
  ];
  var MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  var byMonth = {};
  milestones.forEach(function (ms) { byMonth[ms.m] = ms; });

  /* ---------------- candle data ---------------- */
  // Deterministic "random" so the chart looks the same on every visit.
  var seed = 7;
  function rnd() { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }

  // Trend anchors: [month, level]. Milestone months get a jump.
  var anchors = [["2022-11", 10], ["2023-05", 21], ["2023-06", 34], ["2024-07", 52], ["2024-08", 68],
                 ["2025-08", 92], ["2025-09", 122], ["2026-02", 138], ["2026-03", 147], ["2026-08", 166], ["2026-09", 178], ["2026-10", 184]];

  function monthKey(y, mo) { return y + "-" + (mo < 10 ? "0" : "") + mo; }
  function parseKey(k) { var p = k.split("-"); return { y: +p[0], mo: +p[1] }; }
  function monthIndex(k) { var p = parseKey(k); return p.y * 12 + p.mo - 1; }

  var now = new Date();
  var endKey = monthKey(now.getFullYear(), now.getMonth() + 1);
  if (monthIndex(endKey) < monthIndex("2026-10")) endKey = "2026-10";

  function levelAt(idx) {
    for (var i = 0; i < anchors.length - 1; i++) {
      var a = monthIndex(anchors[i][0]), b = monthIndex(anchors[i + 1][0]);
      if (idx >= a && idx <= b) {
        var t = (idx - a) / (b - a || 1);
        return anchors[i][1] + (anchors[i + 1][1] - anchors[i][1]) * t;
      }
    }
    // past the last anchor: keep climbing gently
    var last = anchors[anchors.length - 1];
    return last[1] + (idx - monthIndex(last[0])) * 3;
  }

  var candles = [];
  var startIdx = monthIndex("2022-11"), endIdx = monthIndex(endKey);
  var prevClose = 9;
  for (var i = startIdx; i <= endIdx; i++) {
    var y = Math.floor(i / 12), mo = (i % 12) + 1, key = monthKey(y, mo);
    var target = levelAt(i);
    var isMs = !!byMonth[key];
    var noise = (rnd() - 0.42) * target * 0.09;
    var close = target + (isMs ? target * 0.03 : noise);
    // a few red months make it believable
    if (!isMs && rnd() < 0.22) close = prevClose - target * (0.02 + rnd() * 0.04);
    var open = prevClose;
    var high = Math.max(open, close) + target * (0.015 + rnd() * 0.04);
    var low = Math.min(open, close) - target * (0.015 + rnd() * 0.04);
    candles.push({ time: key + "-01", open: r2(open), high: r2(high), low: r2(low), close: r2(close) });
    prevClose = close;
  }
  // the chart library rewrites `time` on objects it receives, so always hand it copies
  function cp(o) { return Object.assign({}, o); }
  function r2(n) { return Math.round(n * 100) / 100; }

  var markers = milestones.map(function (ms) {
    // only the big moves get a text label; the rest stay as dots to keep the chart readable
    var major = ms.tag === "HIRED" || ms.tag === "PROMO" || ms.tag === "LEAD";
    return { time: ms.m + "-01", position: "belowBar", color: ms.color,
             shape: major ? "arrowUp" : "circle", text: major ? ms.tag : "" };
  });

  /* ---------------- trade card + milestone chips ---------------- */
  var card = document.getElementById("tradecard");
  var chipsEl = document.getElementById("milestones");
  var chipEls = [];

  milestones.forEach(function (ms, i) {
    var b = document.createElement("button");
    b.type = "button";
    b.className = "ms" + (ms.gold ? " ms--gold" : "");
    b.setAttribute("role", "listitem");
    b.setAttribute("aria-pressed", "false");
    var p = parseKey(ms.m);
    b.textContent = MONTHS[p.mo - 1] + " " + p.y + " · " + ms.tag;
    b.addEventListener("click", function () { select(i, true); });
    chipsEl.appendChild(b);
    chipEls.push(b);
  });

  function sideBadge(side) {
    var cls = side === "SIGNAL" ? "badge badge--gold" : "badge badge--buy";
    return '<span class="' + cls + '">' + side + "</span>";
  }

  var current = -1;
  function select(i, focusChart) {
    var ms = milestones[i];
    current = i;
    chipEls.forEach(function (el, j) { el.setAttribute("aria-pressed", j === i ? "true" : "false"); });
    card.classList.remove("is-fresh");
    void card.offsetWidth;
    card.classList.add("is-fresh");
    card.innerHTML =
      '<div class="tradecard__top">' + sideBadge(ms.side) + "<span>" + ms.date + "</span><span>· SHMR</span></div>" +
      "<h3>" + ms.title + "</h3><p>" + ms.body + "</p>";
    if (focusChart && chart) {
      var idx = monthIndex(ms.m) - startIdx;
      var ts = chart.timeScale();
      var range = ts.getVisibleLogicalRange();
      if (range && (idx < range.from || idx > range.to)) ts.fitContent();
    }
  }

  /* ---------------- chart ---------------- */
  var chart = null, series = null;
  var priceEl = document.getElementById("price");
  var chgEl = document.getElementById("chg");
  var baseOpen = candles[0].open;

  function showPrice(close, prev) {
    priceEl.textContent = "$" + close.toFixed(2);
    var pct = ((close - baseOpen) / baseOpen) * 100;
    chgEl.textContent = "▲ " + pct.toFixed(0) + "% since entry";
    if (prev != null) {
      priceEl.classList.remove("flash-up", "flash-down");
      priceEl.classList.add(close >= prev ? "flash-up" : "flash-down");
      setTimeout(function () { priceEl.classList.remove("flash-up", "flash-down"); }, 500);
    }
  }

  var chartEl = document.getElementById("chart");
  if (window.LightweightCharts) {
    chart = LightweightCharts.createChart(chartEl, {
      autoSize: true,
      layout: { background: { type: "solid", color: "transparent" }, textColor: C.text, fontFamily: "JetBrains Mono, monospace", fontSize: 11 },
      grid: { vertLines: { color: C.line }, horzLines: { color: C.line } },
      rightPriceScale: { borderColor: C.line, scaleMargins: { top: 0.1, bottom: 0.15 } },
      timeScale: { borderColor: C.line, fixLeftEdge: true, fixRightEdge: true, rightOffset: 2 },
      crosshair: { mode: 1, vertLine: { color: "#3a4554", labelBackgroundColor: "#222a35" }, horzLine: { color: "#3a4554", labelBackgroundColor: "#222a35" } },
      handleScroll: false,
      handleScale: false,
      localization: { priceFormatter: function (p) { return "$" + p.toFixed(0); } }
    });
    series = chart.addCandlestickSeries({
      upColor: C.up, downColor: C.down, borderUpColor: C.up, borderDownColor: C.down,
      wickUpColor: C.up, wickDownColor: C.down,
      autoscaleInfoProvider: function (orig) {
        var r = orig();
        if (r && r.priceRange) r.priceRange.minValue = Math.max(0, r.priceRange.minValue);
        return r;
      }
    });

    chart.subscribeClick(function (param) {
      if (!param || param.time == null) return;
      var t = param.time;
      var key = typeof t === "string" ? t.slice(0, 7)
              : typeof t === "object" ? monthKey(t.year, t.month)
              : (function (d) { return monthKey(d.getUTCFullYear(), d.getUTCMonth() + 1); })(new Date(t * 1000));
      // nearest milestone within 1 month of the click
      var idx = monthIndex(key), best = -1, bestD = 2;
      milestones.forEach(function (ms, i) {
        var d = Math.abs(monthIndex(ms.m) - idx);
        if (d < bestD) { bestD = d; best = i; }
      });
      if (best >= 0) select(best, false);
    });

    var replaying = false;
    var replay = function () {
      if (replaying) return;
      replaying = true;
      series.setData([]);
      series.setMarkers([]);
      var n = 0;
      var step = function () {
        var c = candles[n];
        series.update(cp(c));
        series.setMarkers(markers.filter(function (m) { return m.time <= c.time; }).map(cp));
        chart.timeScale().fitContent();
        showPrice(c.close, null);
        if (byMonth[c.time.slice(0, 7)]) select(milestones.indexOf(byMonth[c.time.slice(0, 7)]), false);
        n++;
        if (n < candles.length) setTimeout(step, 55);
        else replaying = false;
      };
      step();
    };

    if (reduceMotion) {
      series.setData(candles.map(cp));
      series.setMarkers(markers.map(cp));
      chart.timeScale().fitContent();
      showPrice(candles[candles.length - 1].close, null);
      select(milestones.length - 1, false);
    } else {
      // start replay when the chart is on screen
      var started = false;
      var io0 = new IntersectionObserver(function (es) {
        if (es[0].isIntersecting && !started) { started = true; replay(); io0.disconnect(); }
      }, { threshold: 0.3 });
      io0.observe(chartEl);
    }
    document.getElementById("replay").addEventListener("click", replay);

    // live tick on the latest candle
    if (!reduceMotion) {
      setInterval(function () {
        if (replaying) return;
        var last = candles[candles.length - 1];
        var prev = last.close;
        var drift = (Math.random() - 0.45) * last.close * 0.006;
        var close = r2(Math.min(Math.max(last.close + drift, last.open * 0.98), last.open * 1.12));
        last.close = close;
        last.high = Math.max(last.high, close);
        last.low = Math.min(last.low, close);
        series.update(cp(last));
        showPrice(close, prev);
      }, 1600);
    }
  } else {
    // chart library failed to load: keep the content usable
    chartEl.style.display = "none";
    document.getElementById("replay").style.display = "none";
    showPrice(candles[candles.length - 1].close, null);
    select(milestones.length - 1, false);
  }

  /* ---------------- reveal + counters ---------------- */
  var targets = document.querySelectorAll(".section__head, .stat, .trade, .stack__row, .signal, .contact__card");
  if (!reduceMotion && "IntersectionObserver" in window) {
    targets.forEach(function (el) { el.classList.add("reveal"); });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add("is-in");
        var v = e.target.querySelector("[data-count]");
        if (v) countUp(v);
        io.unobserve(e.target);
      });
    }, { threshold: 0.15 });
    targets.forEach(function (el) { io.observe(el); });
  }

  function countUp(el) {
    var end = +el.getAttribute("data-count");
    var suffix = el.getAttribute("data-suffix") || "";
    if (end === 0) return;
    var t0 = null, dur = 1100;
    function frame(t) {
      if (!t0) t0 = t;
      var p = Math.min((t - t0) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(end * eased) + suffix;
      if (p < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

})();
