// ════════════════════════════════════════════════
//  OS CORE — smooth scroll, window manager, taskbar,
//  file manager, shutdown/BSOD, and the humor runtime
//  v3: after boot, desktop mode is real — windows drag,
//  stack, minimize, and launch from icons. mobile keeps
//  the scroll session ("breakOS Mobile" is worse on purpose).
// ════════════════════════════════════════════════
gsap.registerPlugin(ScrollTrigger);
const REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
// one mode per page load — matches the 720px "breakOS Mobile" breakpoint
const DESKTOP = window.matchMedia("(min-width: 721px)").matches;

// ── Lenis smooth scroll ──
if (!REDUCED) {
  const lenis = new Lenis({ duration: 1.1, smoothWheel: true });
  window.__lenis = lenis;
  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
}
// Lenis owns the wheel globally — scrollable panes must opt out or their
// wheel events die once the desktop stops the root scroller
document
  .querySelectorAll(".win-body")
  .forEach((el) => el.setAttribute("data-lenis-prevent", ""));

// ── kernel log (console easter egg) ──
console.log(
  "%cbreakOS kernel 4.0%c\n[ ok ] devtools detected — promoting visitor to power user\n[ ok ] this console is the only part of the site with no CSS. enjoy the silence\n[warn] the OS is a metaphor. the repos are real: https://github.com/nitrimandylis\n[ ok ] the windows drag now. try throwing a file in the trash. it won't work.",
  "color:#f25c4a;font-size:20px;font-family:monospace;font-weight:bold",
  "color:#8a8a8a;font-family:monospace;font-size:12px",
);

// ── tab title gag ──
const REAL_TITLE = document.title;
document.addEventListener("visibilitychange", () => {
  document.title = document.hidden
    ? "breakOS — suspended (it'll keep)"
    : REAL_TITLE;
});

// ── clock ──
function tickClock() {
  const d = new Date();
  document.getElementById("tb-clock").textContent =
    String(d.getHours()).padStart(2, "0") +
    ":" +
    String(d.getMinutes()).padStart(2, "0");
}
tickClock();
setInterval(tickClock, 10000);

// ── scroll progress in taskbar (boot progress, once booted it stays full) ──
window.addEventListener(
  "scroll",
  () => {
    if (document.body.classList.contains("booted")) return;
    const el = document.documentElement;
    const pct = el.scrollTop / (el.scrollHeight - el.clientHeight) || 0;
    document.getElementById("tb-progress-fill").style.width = pct * 100 + "%";
  },
  { passive: true },
);

// ── OS toast (speed judge + system notices) ──
const toast = document.getElementById("os-toast");
let toastBusy = false;
function notify(msg, ms = 2800) {
  if (toastBusy) return;
  toastBusy = true;
  toast.textContent = msg;
  toast.classList.add("visible");
  setTimeout(() => {
    toast.classList.remove("visible");
    toastBusy = false;
  }, ms);
}
window.__notify = notify;

if (!REDUCED) {
  let lastY = window.scrollY,
    lastT = performance.now(),
    cool = 0;
  const FAST = [
    "notice: scroll velocity exceeds reading speed",
    "the boot log is honest, you know. if you read it.",
    "achievement unlocked: speedrun (boot%)",
  ];
  window.addEventListener(
    "scroll",
    () => {
      const now = performance.now();
      const v = Math.abs(window.scrollY - lastY) / Math.max(now - lastT, 1);
      lastY = window.scrollY;
      lastT = now;
      if (v > 7 && now > cool) {
        cool = now + 18000;
        notify(FAST[Math.floor(Math.random() * FAST.length)]);
      }
    },
    { passive: true },
  );
}

// ── mobile-only: window drift-in on scroll (desktop mode animates per-open) ──
if (!REDUCED && !DESKTOP) {
  document.querySelectorAll(".window[data-drift]").forEach((win) => {
    const fromLeft = win.dataset.drift === "left";
    gsap.from(win, {
      x: fromLeft ? -160 : 160,
      y: 80,
      rotation: fromLeft ? -2.5 : 2.5,
      opacity: 0,
      ease: "power3.out",
      duration: 1.1,
      scrollTrigger: { trigger: win, start: "top 85%" },
    });
  });
  gsap.from(".shutdown-dialog", {
    scale: 0.7,
    opacity: 0,
    ease: "back.out(1.6)",
    duration: 0.7,
    scrollTrigger: { trigger: "#ws-shutdown", start: "top 70%" },
  });
}

// ── desktop icons: select, drag, double-click to open.
//    no parallax — real desktops hold still (and parallax used to scrub
//    icons clean off-screen by the end of the boot). positions persist. ──
const ICON_QUIPS = {
  my_computer: "no drives found. the computer is fine.",
  untitled_final_v2_REAL: "there are 11 more versions. this is the real one.",
  "do_not_open.txt": "too late.",
  "dial_up.exe": "connecting… 56k… connected. do not pick up the phone.",
  "passwords.txt": "hunter2. always hunter2.",
  "shortcut to shortcut":
    "this is a shortcut to a shortcut. the original was lost.",
  "important_FINAL_v3.zip": "contains: important_FINAL_v2.zip.",
};
const iconEls = Array.from(document.querySelectorAll(".icon"));
const ICON_POS_KEY = "breakos-icons-v1";
let iconPos = {};
try {
  iconPos = JSON.parse(localStorage.getItem(ICON_POS_KEY) || "{}");
} catch (_) {}
const iconKey = (icon) =>
  icon.id ||
  icon.dataset.open ||
  (icon.querySelector(".icon-label")?.textContent || "");

// restore saved spots (stored as viewport percentages)
iconEls.forEach((icon) => {
  const p = iconPos[iconKey(icon)];
  if (p) {
    icon.style.left = p[0] + "vw";
    icon.style.top = p[1] + "vh";
    icon.style.right = "auto";
  }
});

function clearIconSel() {
  iconEls.forEach((i) => i.classList.remove("selected"));
}

// gentle ambient float on the inner element — never fights dragging
if (!REDUCED)
  iconEls.forEach((icon, i) => {
    gsap.to(icon.querySelector(".icon-float"), {
      y: "+=" + (4 + (i % 5)),
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut",
      duration: 2.6 + (i % 7) * 0.35,
      delay: (i % 6) * 0.3,
    });
  });

let appHintShown = false;
if (DESKTOP) {
  iconEls.forEach((icon) => {
    icon.style.touchAction = "none";
    let justDragged = false;
    icon.addEventListener("pointerdown", (e) => {
      e.stopPropagation(); // the background marquee must not start on icons
      icon.setPointerCapture(e.pointerId);
      const sx = e.clientX,
        sy = e.clientY;
      // dragging a selected icon moves the whole selection with it
      const members = icon.classList.contains("selected")
        ? iconEls.filter((i) => i.classList.contains("selected"))
        : [icon];
      const group = members.map((el) => ({
        el,
        r: el.getBoundingClientRect(),
      }));
      let moved = false;
      const move = (ev) => {
        const dx = ev.clientX - sx,
          dy = ev.clientY - sy;
        if (!moved && Math.hypot(dx, dy) > 5) {
          moved = true;
          group.forEach(({ el }) => {
            el.classList.add("dragged");
            el.style.right = "auto";
          });
        }
        if (!moved) return;
        group.forEach(({ el, r }) => {
          el.style.left =
            Math.max(
              2,
              Math.min(r.left + dx, window.innerWidth - r.width - 2),
            ) + "px";
          el.style.top =
            Math.max(
              2,
              Math.min(r.top + dy, window.innerHeight - r.height - 46),
            ) + "px";
        });
      };
      const up = () => {
        icon.removeEventListener("pointermove", move);
        icon.removeEventListener("pointerup", up);
        icon.removeEventListener("pointercancel", up);
        group.forEach(({ el }) => el.classList.remove("dragged"));
        if (moved) {
          justDragged = true;
          setTimeout(() => (justDragged = false), 0);
          group.forEach(({ el }) => {
            const rr = el.getBoundingClientRect();
            iconPos[iconKey(el)] = [
              +((rr.left / window.innerWidth) * 100).toFixed(2),
              +((rr.top / window.innerHeight) * 100).toFixed(2),
            ];
          });
          try {
            localStorage.setItem(ICON_POS_KEY, JSON.stringify(iconPos));
          } catch (_) {}
        }
      };
      icon.addEventListener("pointermove", move);
      icon.addEventListener("pointerup", up);
      icon.addEventListener("pointercancel", up);
    });

    icon.addEventListener("click", (e) => {
      if (justDragged) return;
      const was = icon.classList.contains("selected");
      if (!e.shiftKey) clearIconSel();
      icon.classList.toggle("selected", e.shiftKey ? !was : true);
      if (icon.dataset.open && !appHintShown) {
        appHintShown = true;
        notify(
          "single click selects. double-click launches. this is an OS, not a website.",
          3600,
        );
      }
    });

    icon.addEventListener("dblclick", () => {
      clearIconSel();
      if (icon.dataset.open) return openApp(icon.dataset.open, "icon");
      if (icon.id === "icon-trash") return trashSummary();
      const q = ICON_QUIPS[iconKey(icon)];
      if (q) notify(q, 3200);
    });
  });

  // marquee selection on empty desktop
  let mq = null,
    mx = 0,
    my = 0;
  document.addEventListener("pointerdown", (e) => {
    if (!booted || mq) return;
    const t = e.target;
    if (
      t !== document.body &&
      t !== document.documentElement &&
      t.tagName !== "MAIN"
    )
      return;
    e.preventDefault(); // no native text selection while sweeping the desk
    try {
      window.getSelection().removeAllRanges();
    } catch (_) {}
    document.body.classList.add("marqueeing");
    if (!e.shiftKey) clearIconSel();
    mx = e.clientX;
    my = e.clientY;
    mq = document.createElement("div");
    mq.className = "marquee";
    document.body.appendChild(mq);
    const move = (ev) => {
      const x = Math.min(mx, ev.clientX),
        y = Math.min(my, ev.clientY);
      const w = Math.abs(ev.clientX - mx),
        h = Math.abs(ev.clientY - my);
      Object.assign(mq.style, {
        left: x + "px",
        top: y + "px",
        width: w + "px",
        height: h + "px",
      });
      iconEls.forEach((icon) => {
        const r = icon.getBoundingClientRect();
        const hit =
          r.left < x + w && r.right > x && r.top < y + h && r.bottom > y;
        if (hit) icon.classList.add("selected");
        else if (!ev.shiftKey) icon.classList.remove("selected");
      });
    };
    const up = () => {
      document.removeEventListener("pointermove", move);
      document.removeEventListener("pointerup", up);
      document.body.classList.remove("marqueeing");
      if (mq) mq.remove();
      mq = null;
    };
    document.addEventListener("pointermove", move);
    document.addEventListener("pointerup", up);
  });
} else {
  // mobile hides the icons; keep quips wired for odd viewports
  iconEls.forEach((icon) => {
    const q = ICON_QUIPS[iconKey(icon)];
    if (q) icon.addEventListener("click", () => notify(q, 3200));
  });
}

// ════════════════════════════════════════════════
//  WINDOW MANAGER
//  desktop: real WM — drag, z-order, minimize, launch.
//  mobile: the old close-to-tray behavior, untouched.
// ════════════════════════════════════════════════
const tray = document.getElementById("tb-tray");
const CLOSE_QUIPS = {
  "things-i-made": "things-i-made moved to Trash. the leftovers stay put.",
  "system-monitor":
    "monitor closed. the processes keep running. they always do.",
  breakpkg: "breakpkg closed. the packages stay installed. that's the deal.",
  terminal: "terminal closed. it whispered 'logout' as it went.",
  about: "about.app moved to Trash. bold move.",
  "new-message": "draft discarded. the duck email waits patiently.",
};

const APPS = {
  "things-i-made": { win: "win-files", glyph: "▤", name: "things-i-made" },
  breakpkg: { win: "win-pkg", glyph: "▦", name: "breakpkg" },
  "system-monitor": { win: "win-monitor", glyph: "◔", name: "monitor" },
  terminal: { win: "win-terminal", glyph: "▮", name: "terminal" },
  about: { win: "win-about", glyph: "◍", name: "about" },
  "new-message": { win: "win-mail", glyph: "✉", name: "message" },
};

const WM = {}; // app key → live state
let zTop = 20;
let booted = false;

function openApp(key, src) {
  if (!DESKTOP) return;
  const st = WM[key];
  if (!st) return;
  if (!booted) return notify("still booting. scroll.");
  if (st.minimized) return restoreApp(key);
  if (st.open) return focusApp(key);
  st.open = true;
  st.el.classList.remove("closed");
  gsap.killTweensOf(st.el);
  gsap.set(st.el, { clearProps: "transform,opacity" });
  if (!st.placed) {
    placeApp(st);
    st.placed = true;
  }
  focusApp(key);
  if (!REDUCED) {
    // launched from taskbar → grow from below; otherwise from center-ish
    st.el.style.transformOrigin = src === "taskbar" ? "50% 110%" : "50% 60%";
    gsap.fromTo(
      st.el,
      { scale: 0.94, opacity: 0, y: 8 },
      {
        scale: 1,
        opacity: 1,
        y: 0,
        duration: 0.2,
        ease: "expo.out",
        clearProps: "scale,opacity,y",
      },
    );
    // package rows cascade in on first open — 40ms apart, decorative only
    if (key === "breakpkg" && !st.staggered) {
      st.staggered = true;
      gsap.from(".pkgpkg", {
        opacity: 0,
        y: 6,
        duration: 0.22,
        stagger: 0.04,
        ease: "expo.out",
        clearProps: "opacity,y",
      });
    }
  }
  syncTaskbar();
}

function closeApp(key) {
  const st = WM[key];
  if (!st || !st.open) return;
  const done = () => {
    st.el.classList.add("closed");
    if (st.el.classList.contains("maximized")) {
      // a closed window forgets it was maximized — and gets its spot back
      st.el.classList.remove("maximized");
      if (st.premax) {
        st.el.style.left = st.premax.left;
        st.el.style.top = st.premax.top;
      }
      if (WM.__setMaxGlyph) WM.__setMaxGlyph(st);
    }
    gsap.set(st.el, { clearProps: "transform,opacity" });
    st.open = false;
    st.minimized = false;
    focusTop();
    syncTaskbar();
  };
  gsap.killTweensOf(st.el);
  if (REDUCED) done();
  else
    gsap.to(st.el, {
      scale: 0.96,
      opacity: 0,
      duration: 0.14,
      ease: "power2.out",
      onComplete: done,
    });
  notify(CLOSE_QUIPS[key] || key + " closed.");
}

function minimizeApp(key) {
  const st = WM[key];
  if (!st || !st.open || st.minimized) return;
  st.minimized = true;
  const done = () => {
    st.el.classList.add("closed");
    focusTop();
    syncTaskbar();
  };
  gsap.killTweensOf(st.el);
  if (REDUCED) done();
  else {
    st.el.style.transformOrigin = "50% 100%";
    gsap.to(st.el, {
      scale: 0.9,
      y: 26,
      opacity: 0,
      duration: 0.16,
      ease: "power2.out",
      onComplete: () => {
        gsap.set(st.el, { clearProps: "scale,y,opacity" });
        done();
      },
    });
  }
}

function restoreApp(key) {
  const st = WM[key];
  if (!st || !st.minimized) return;
  st.minimized = false;
  st.el.classList.remove("closed");
  gsap.killTweensOf(st.el);
  focusApp(key);
  if (!REDUCED)
    gsap.fromTo(
      st.el,
      { scale: 0.92, y: 18, opacity: 0 },
      {
        scale: 1,
        y: 0,
        opacity: 1,
        duration: 0.18,
        ease: "expo.out",
        clearProps: "scale,y,opacity",
      },
    );
  syncTaskbar();
}

function focusApp(key) {
  const st = WM[key];
  if (!st) return;
  st.el.style.zIndex = ++zTop;
  Object.keys(APPS).forEach((k) =>
    WM[k].el.classList.toggle("inactive", k !== key),
  );
  WM.__focused = key;
  syncTaskbar();
}

function focusTop() {
  // after a close/minimize, hand focus to whichever open window is highest
  let best = null,
    bestZ = -1;
  Object.entries(APPS).forEach(([k]) => {
    const s = WM[k];
    if (s.open && !s.minimized && +s.el.style.zIndex > bestZ) {
      bestZ = +s.el.style.zIndex;
      best = k;
    }
  });
  if (best) focusApp(best);
}

function placeApp(st) {
  // cascade defaults, clear of the icon column on the left
  const stage = document.getElementById("stage");
  const W = stage.clientWidth,
    H = stage.clientHeight;
  const w = Math.min(st.el.offsetWidth || 720, W - 40);
  const i = st.index;
  st.el.style.left =
    Math.max(150, Math.min(150 + i * 40, W - w - 24)) + "px";
  st.el.style.top = Math.min(34 + i * 34, Math.max(24, H - 320)) + "px";
}

function syncTaskbar() {
  if (!DESKTOP) return;
  Object.entries(APPS).forEach(([key]) => {
    const st = WM[key];
    if (!st || !st.btn) return;
    st.btn.dataset.state = st.minimized
      ? "min"
      : st.open
        ? "open"
        : "closed";
    st.btn.classList.toggle(
      "active",
      st.open && !st.minimized && WM.__focused === key,
    );
  });
  if (window.__onWinCount) window.__onWinCount(window.__winCount());
}
window.__winCount = () =>
  Object.keys(APPS).filter((k) => WM[k] && WM[k].open && !WM[k].minimized)
    .length;
window.__openApp = openApp;

if (DESKTOP) {
  // build the stage and adopt every window into it
  document.body.classList.add("desktop");
  const stage = document.createElement("div");
  stage.id = "stage";
  document.querySelector("main").appendChild(stage);

  Object.entries(APPS).forEach(([key, app], i) => {
    const el = document.getElementById(app.win);
    stage.appendChild(el);
    el.classList.add("closed");
    WM[key] = {
      el,
      index: i,
      open: false,
      minimized: false,
      placed: false,
    };

    // taskbar button — a real app switcher, not a graveyard
    const b = document.createElement("button");
    b.className = "tb-task";
    b.dataset.state = "closed";
    b.innerHTML = app.glyph + " " + app.name;
    b.title = key;
    b.addEventListener("click", () => {
      const st = WM[key];
      if (!st.open) return openApp(key, "taskbar");
      if (st.minimized) return restoreApp(key);
      if (WM.__focused === key) return minimizeApp(key);
      focusApp(key);
    });
    tray.appendChild(b);
    WM[key].btn = b;

    // any mousedown in the window raises it — like a real OS
    el.addEventListener("pointerdown", () => {
      if (WM.__focused !== key) focusApp(key);
    });

    // titlebar: drag + dblclick maximize + button actions
    const bar = el.querySelector(".titlebar");
    bar.addEventListener("dblclick", (e) => {
      if (e.target.closest(".tb-btn")) return;
      toggleMax(key);
    });
    bar.addEventListener("pointerdown", (e) => {
      if (e.target.closest(".tb-btn")) return;
      focusApp(key);
      const st = WM[key];
      if (st.dragging) return; // multi-touch protection
      st.dragging = true;
      bar.setPointerCapture(e.pointerId);
      let sx = e.clientX,
        sy = e.clientY;
      let ox = parseFloat(el.style.left) || 0,
        oy = parseFloat(el.style.top) || 0;
      const W = stage.clientWidth,
        H = stage.clientHeight;
      let w = el.offsetWidth;
      let wasMax = el.classList.contains("maximized");
      let moved = false;
      const move = (ev) => {
        const dx = ev.clientX - sx,
          dy = ev.clientY - sy;
        if (!moved && Math.abs(dx) + Math.abs(dy) > (wasMax ? 6 : 2)) {
          moved = true;
          el.classList.add("dragging");
          if (wasMax) {
            // drag unsnaps a maximized window — it pops back to normal
            // size under the cursor, like a real OS
            wasMax = false;
            el.classList.remove("maximized");
            setMaxGlyph(st);
            w = Math.min(720, W * 0.72); // matches the stage width rule
            ox = Math.max(-w + 130, Math.min(ev.clientX - w * 0.4, W - 130));
            oy = Math.max(0, ev.clientY - 14);
            el.style.left = ox + "px";
            el.style.top = oy + "px";
            sx = ev.clientX;
            sy = ev.clientY;
            return;
          }
        }
        if (!moved) return;
        el.style.left =
          Math.max(-w + 130, Math.min(ox + dx, W - 130)) + "px";
        el.style.top = Math.max(0, Math.min(oy + dy, H - 44)) + "px";
      };
      const up = () => {
        st.dragging = false;
        el.classList.remove("dragging");
        bar.removeEventListener("pointermove", move);
        bar.removeEventListener("pointerup", up);
        bar.removeEventListener("pointercancel", up);
      };
      bar.addEventListener("pointermove", move);
      bar.addEventListener("pointerup", up);
      bar.addEventListener("pointercancel", up);
    });

    el.querySelectorAll(".tb-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        if (btn.dataset.act === "close") closeApp(key);
        else if (btn.dataset.act === "min") minimizeApp(key);
        else if (btn.dataset.act === "max") toggleMax(key);
      });
    });
  });

  function setMaxGlyph(st) {
    const btn = st.el.querySelector('.tb-btn[data-act="max"]');
    if (btn)
      btn.textContent = st.el.classList.contains("maximized") ? "❐" : "□";
  }

  function toggleMax(key) {
    const st = WM[key];
    gsap.killTweensOf(st.el);
    gsap.set(st.el, { clearProps: "transform,opacity" });
    if (st.el.classList.contains("maximized")) {
      // restore the pre-max spot
      st.el.classList.remove("maximized");
      st.el.style.left = st.premax ? st.premax.left : st.el.style.left;
      st.el.style.top = st.premax ? st.premax.top : st.el.style.top;
    } else {
      // inline left/top would override the maximized inset — park them
      st.premax = { left: st.el.style.left, top: st.el.style.top };
      st.el.style.left = "";
      st.el.style.top = "";
      st.el.classList.add("maximized");
    }
    setMaxGlyph(st);
    if (!REDUCED)
      gsap.from(st.el, { scale: 0.985, duration: 0.15, ease: "expo.out" });
    focusApp(key);
  }
  WM.__toggleMax = toggleMax;
  WM.__setMaxGlyph = setMaxGlyph;

  // (app icons launch on double-click — wired in the icon system above)
} else {
  // ── mobile: the old close/maximize/tray behavior, unchanged ──
  document.querySelectorAll(".window .tb-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const win = btn.closest(".window");
      if (win.classList.contains("overlay-win")) return;
      const app = win.dataset.app;
      if (btn.dataset.act === "close") {
        win.classList.add("closed");
        win.classList.remove("maximized");
        notify(CLOSE_QUIPS[app] || app + " closed.");
        const b = document.createElement("button");
        b.className = "tb-app";
        b.textContent = "▣ " + app;
        b.title = "reopen " + app;
        b.addEventListener("click", () => {
          win.classList.remove("closed");
          b.remove();
          notify(app + " restored from Trash. no questions asked.");
          win.scrollIntoView({
            behavior: REDUCED ? "auto" : "smooth",
            block: "center",
          });
        });
        tray.appendChild(b);
      } else if (btn.dataset.act === "max") {
        win.classList.toggle("maximized");
        btn.textContent = win.classList.contains("maximized") ? "❐" : "□";
      }
    });
  });
}

// ════════════════════════════════════════════════
//  BOOT → DESKTOP handoff
// ════════════════════════════════════════════════
const startMenu = document.getElementById("start-menu");
const sdModal = document.getElementById("sd-modal");

function enterDesktop() {
  if (!DESKTOP || booted) return;
  booted = true;
  document.body.classList.add("booted");
  document.documentElement.style.overflow = "hidden";
  if (window.__lenis) window.__lenis.stop();
  document.getElementById("tb-progress-fill").style.width = "100%";
  // adopt the shutdown dialog into its modal shell
  sdModal.appendChild(document.querySelector(".shutdown-dialog"));
  const stage = document.getElementById("stage");
  if (REDUCED) stage.classList.add("on");
  else {
    stage.classList.add("on");
    gsap.from(stage, { opacity: 0, duration: 0.35, ease: "power1.out" });
    gsap.from(".app-icon", {
      opacity: 0,
      y: 6,
      duration: 0.25,
      stagger: 0.04,
      ease: "expo.out",
      clearProps: "opacity,y",
    });
  }
  setTimeout(() => openApp("things-i-made", "icon"), 550);
  notify("desktop session started. the windows drag now. go on.");
}
window.__enterDesktop = enterDesktop;

function exitDesktop() {
  if (!booted) return;
  booted = false;
  document.body.classList.remove("booted");
  document.getElementById("stage").classList.remove("on");
  document.documentElement.style.overflow = "";
  if (window.__lenis) window.__lenis.start();
  Object.keys(APPS).forEach((k) => {
    const st = WM[k];
    st.open = false;
    st.minimized = false;
    gsap.killTweensOf(st.el);
    gsap.set(st.el, { clearProps: "transform,opacity" });
    st.el.classList.add("closed");
    st.el.classList.remove("maximized", "inactive");
    if (WM.__setMaxGlyph) WM.__setMaxGlyph(st);
  });
  syncTaskbar();
  hideMenu();
  sdModal.classList.remove("open");
  window.scrollTo({ top: 0, behavior: "auto" });
}

// ── start button / start menu ──
function hideMenu() {
  startMenu.classList.remove("open");
  startMenu.setAttribute("aria-hidden", "true");
}
document.getElementById("tb-start").addEventListener("click", (e) => {
  if (DESKTOP && booted) {
    e.stopPropagation();
    const open = startMenu.classList.toggle("open");
    startMenu.setAttribute("aria-hidden", String(!open));
  } else if (DESKTOP) {
    notify("start menu loads after boot. scroll.");
  } else {
    window.scrollTo({ top: 0, behavior: REDUCED ? "auto" : "smooth" });
    notify("start menu not found. there is only scroll.");
  }
});
startMenu.querySelectorAll(".sm-item[data-open]").forEach((item) => {
  item.addEventListener("click", () => {
    openApp(item.dataset.open, "taskbar");
    hideMenu();
  });
});
document.getElementById("sm-shutdown").addEventListener("click", () => {
  hideMenu();
  sdModal.classList.add("open");
  sdModal.setAttribute("aria-hidden", "false");
  if (!REDUCED)
    gsap.fromTo(
      ".shutdown-dialog",
      { scale: 0.92, opacity: 0 },
      { scale: 1, opacity: 1, duration: 0.2, ease: "expo.out" },
    );
});
document.addEventListener("click", (e) => {
  if (
    startMenu.classList.contains("open") &&
    !startMenu.contains(e.target) &&
    e.target.id !== "tb-start"
  )
    hideMenu();
});
sdModal.addEventListener("click", (e) => {
  if (e.target === sdModal) sdModal.classList.remove("open");
});

// ── shared repo fetch: one request, 30-min cache, monitor.js + breakpkg reuse this ──
window.BREAKOS_REPOS = (function () {
  const USER = "nitrimandylis";
  const CACHE_KEY = "breakos-repos-v1";
  const CACHE_TTL = 1000 * 60 * 30;
  try {
    const c = JSON.parse(localStorage.getItem(CACHE_KEY) || "null");
    if (c && Date.now() - c.at < CACHE_TTL) return Promise.resolve(c.repos);
  } catch (_) {}
  return fetch(
    `https://api.github.com/users/${USER}/repos?sort=pushed&per_page=100`,
  )
    .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
    .then((repos) => {
      try {
        localStorage.setItem(
          CACHE_KEY,
          JSON.stringify({ at: Date.now(), repos }),
        );
      } catch (_) {}
      return repos;
    });
})();

// ── file manager: fixed leftovers. the real list lives on nicktrim.com ──
// shared with the terminal's ls/cat, and with the trash
window.BREAKOS_FILES = [
  {
    name: "the_real_list.url",
    kind: "internet shortcut",
    verdict: "everything nick made. not here.",
    url: "https://nicktrim.com/work",
    body: "the actual list of things nick made lives at nicktrim.com/work. this folder only keeps the leftovers.",
    trash: "the_real_list.url is a shortcut. deleting it deletes nothing. the list lives elsewhere.",
  },
  {
    name: "todo_FINAL.txt",
    kind: "plain text · 3 lines",
    verdict: "item 3 says see item 1.",
    body: "1. finish side project.\n2. start new side project.\n3. see 1.",
    trash: "todo_FINAL.txt cannot be deleted. it is not finished.",
  },
  {
    name: "ideas_3am.md",
    kind: "markdown · 47 entries",
    verdict: "two are good. nobody knows which.",
    body: "47 ideas, all written between 1am and 4am. two of them are good. the rest became repos anyway.",
    trash: "ideas_3am.md resists. one of these might be the good one.",
  },
  {
    name: "node_modules",
    kind: "folder · 1.2 GB",
    verdict: "do not open.",
    body: "1.2 GB. contents unknown. you opened it anyway. it has a node_modules of its own.",
    trash: "node_modules is too large for the trash. the trash asked for a bigger trash.",
  },
  {
    name: "breakos.sys",
    kind: "system file",
    verdict: "the old site, on the night shift.",
    body: "this site. it used to be the portfolio. now it works nights at os.nicktrim.com and the day job went to nicktrim.com.",
    trash: "breakos.sys is in use by breakOS. by you, technically.",
  },
  {
    name: "about.txt",
    kind: "plain text",
    verdict: "the short version.",
    body: "nick trimandylis. the long version is at nicktrim.com/about.",
    trash: "about.txt is the only copy of nick. denied.",
  },
];
const BREAKOS_FILE = (name) =>
  window.BREAKOS_FILES.find((f) => f.name === name);


const overlay = document.getElementById("overlay");

function projectEntry(f) {
  return {
    name: f.name,
    voice: f.verdict,
    body: f.body,
    meta: "kind: " + f.kind,
  };
}


function openFile(f) {
  document.getElementById("ov-title").textContent = "▤ " + f.name;
  document.getElementById("ov-name").textContent = f.name;
  document.getElementById("ov-voice").textContent = f.voice;
  document.getElementById("ov-body").textContent = f.body;
  document.getElementById("ov-meta").innerText = f.meta;
  overlay.classList.add("open");
}

// ── trash: a real drop target. deletion is not on the menu ──
const trashIcon = document.getElementById("icon-trash");
const trashLabel = document.getElementById("trash-label");
const TRASH_KEY = "breakos-trash-attempts";
let trashTries = 0;
try {
  trashTries = parseInt(localStorage.getItem(TRASH_KEY) || "0", 10) || 0;
} catch (_) {}
function paintTrashLabel() {
  trashLabel.textContent =
    trashTries === 0
      ? "trash"
      : "trash (" + trashTries + (trashTries === 1 ? " attempt)" : " attempts)");
}
paintTrashLabel();
function trashQuip(name) {
  const f = BREAKOS_FILE(name);
  return f ? f.trash : "file cannot be deleted: it shipped.";
}

function trashAttempt(key) {
  trashTries++;
  try {
    localStorage.setItem(TRASH_KEY, String(trashTries));
  } catch (_) {}
  paintTrashLabel();
  notify(
    trashQuip(key) +
      " (attempt #" +
      trashTries +
      ")",
    3600,
  );
}
function trashSummary() {
  notify(
    "trash contains: 0 files, " +
      trashTries +
      " failed attempts, 1 crumpled cover letter. everything shipped.",
    3600,
  );
}

// drag a poster card toward the trash (desktop mode only)
function wireFileDrag(card, key) {
  if (!DESKTOP) return;
  card.style.touchAction = "none"; // drag owns the pointer, not scroll
  let ghost = null,
    started = false,
    sx = 0,
    sy = 0,
    origin = null;
  card.addEventListener("pointerdown", (e) => {
    sx = e.clientX;
    sy = e.clientY;
    started = false;
    origin = card.getBoundingClientRect();
    card.setPointerCapture(e.pointerId);
    const move = (ev) => {
      const dx = ev.clientX - sx,
        dy = ev.clientY - sy;
      if (!started && Math.hypot(dx, dy) > 7) {
        started = true;
        ghost = card.cloneNode(true);
        ghost.className = "poster-card file-ghost";
        ghost.style.width = origin.width + "px";
        document.body.appendChild(ghost);
      }
      if (!ghost) return;
      ghost.style.left = ev.clientX - origin.width / 2 + "px";
      ghost.style.top = ev.clientY - 24 + "px";
      const tr = trashIcon.getBoundingClientRect();
      const hot =
        ev.clientX > tr.left - 14 &&
        ev.clientX < tr.right + 14 &&
        ev.clientY > tr.top - 14 &&
        ev.clientY < tr.bottom + 14;
      trashIcon.classList.toggle("trash-hot", hot);
    };
    const up = (ev) => {
      card.removeEventListener("pointermove", move);
      card.removeEventListener("pointerup", up);
      card.removeEventListener("pointercancel", up);
      if (!ghost) return;
      const g = ghost;
      ghost = null;
      const hot = trashIcon.classList.contains("trash-hot");
      trashIcon.classList.remove("trash-hot");
      if (hot) {
        const tr = trashIcon.getBoundingClientRect();
        gsap.to(g, {
          left: tr.left + tr.width / 2 - origin.width / 2,
          top: tr.top,
          scale: 0.15,
          opacity: 0,
          duration: REDUCED ? 0 : 0.22,
          ease: "power2.in",
          onComplete: () => g.remove(),
        });
        trashAttempt(key);
      } else {
        gsap.to(g, {
          left: origin.left,
          top: origin.top,
          opacity: 0,
          duration: REDUCED ? 0 : 0.2,
          ease: "expo.out",
          onComplete: () => g.remove(),
        });
      }
      // swallow the click that would open the file
      const stop = (ce) => {
        ce.stopPropagation();
        ce.preventDefault();
        card.removeEventListener("click", stop, true);
      };
      card.addEventListener("click", stop, true);
      setTimeout(() => card.removeEventListener("click", stop, true), 0);
    };
    card.addEventListener("pointermove", move);
    card.addEventListener("pointerup", up);
    card.addEventListener("pointercancel", up);
  });
}

// leftovers gallery
const posterGrid = document.getElementById("poster-grid");
window.BREAKOS_FILES.forEach((f) => {
  const card = document.createElement("button");
  card.className = "poster-card";
  card.innerHTML =
    '<span class="poster-bar">' +
    '<span class="poster-dot"></span>' +
    '<span class="poster-dot"></span>' +
    '<span class="poster-dot"></span>' +
    "</span>" +
    '<span class="poster-body">' +
    '<span class="poster-name">' +
    f.name +
    "</span>" +
    '<span class="poster-verdict">' +
    f.verdict +
    "</span>" +
    '<span class="poster-kind">' +
    f.kind +
    "</span>" +
    "</span>";
  card.addEventListener("click", () => {
    if (f.url) window.open(f.url, "_blank", "noopener");
    else openFile(projectEntry(f));
  });
  wireFileDrag(card, f.name);
  posterGrid.appendChild(card);
});

document
  .getElementById("ov-close")
  .addEventListener("click", () => overlay.classList.remove("open"));
overlay.addEventListener("click", (e) => {
  if (e.target === overlay) overlay.classList.remove("open");
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    overlay.classList.remove("open");
    hideMenu();
    sdModal.classList.remove("open");
    clearIconSel();
  }
});

// ── shutdown → BSOD → reboot ──
const bsod = document.getElementById("bsod");
function crash() {
  sdModal.classList.remove("open");
  bsod.classList.add("on");
  bsod.setAttribute("aria-hidden", "false");
  let pct = 0;
  const pctEl = document.getElementById("bsod-pct");
  const iv = setInterval(() => {
    pct = Math.min(pct + Math.floor(Math.random() * 22), 100);
    pctEl.textContent = pct + "% complete";
    if (pct >= 100) {
      clearInterval(iv);
      setTimeout(reboot, 700);
    }
  }, 350);
}
function reboot() {
  bsod.classList.remove("on");
  bsod.setAttribute("aria-hidden", "true");
  if (DESKTOP) exitDesktop();
  else window.scrollTo({ top: 0, behavior: "auto" });
  notify("rebooted. scroll to boot again. the OS remembers nothing. you might.");
}
window.__crash = crash;
document.getElementById("sd-yes").addEventListener("click", crash);
document.getElementById("sd-alsoyes").addEventListener("click", crash);
bsod.addEventListener("click", reboot);

// ── uptime (honest visit counter, reborn) ──
let visits = 1;
try {
  visits =
    (parseInt(localStorage.getItem("breakos-visits") || "0", 10) || 0) + 1;
  localStorage.setItem("breakos-visits", String(visits));
} catch (_) {}
document.getElementById("sd-uptime").textContent =
  visits === 1
    ? "boot #1 on this machine — localStorage says we've never met. hi."
    : `boot #${visits} — counted by your own localStorage. you surveil yourself.`;

// ── cheat codes: seal, f1 ──
const f1El = document.getElementById("f1-lights");
let f1Busy = false;
function runF1() {
  if (f1Busy) return;
  f1Busy = true;
  if (REDUCED) {
    notify("lights out and away we go.");
    f1Busy = false;
    return;
  }
  const lights = f1El.querySelectorAll(".f1-row span");
  f1El.classList.add("on");
  lights.forEach((l, i) =>
    setTimeout(() => l.classList.add("lit"), 420 * (i + 1)),
  );
  // random hold, then all out at once — that part is the actual start.
  // the payoff is an apex-style headline, not a toast.
  setTimeout(
    () => {
      lights.forEach((l) => l.classList.remove("lit"));
      f1El.classList.add("go");
      setTimeout(() => {
        f1El.classList.remove("on", "go");
        f1Busy = false;
      }, 2000);
    },
    420 * 5 + 500 + Math.random() * 1200,
  );
}

// clawd — anthropic's pixel crab, from the clawd-animation template:
// canonical 14×8 body grid, eye variants, blink, bubble, heart, particles.
const CLAWD_BODY = [
  [0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0],
  [0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0],
  [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
  [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
  [0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0],
  [0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0],
  [0, 0, 0, 1, 0, 1, 0, 0, 1, 0, 1, 0, 0, 0],
  [0, 0, 0, 1, 0, 1, 0, 0, 1, 0, 1, 0, 0, 0],
];
const CLAWD_EYES = { left: { x: 4, y: 1 }, right: { x: 9, y: 1 } };
const CLAWD_HEART = [
  [1, 0, 1, 0, 0],
  [1, 1, 1, 1, 0],
  [0, 1, 1, 1, 0],
  [0, 0, 1, 0, 0],
];
const CLAWD_COL = "#CD6E58";

// static sprite as an SVG string — the terminal's TTY banner uses this
window.__clawdSprite = function (cell) {
  const rects = [];
  for (let r = 0; r < CLAWD_BODY.length; r++)
    for (let c = 0; c < CLAWD_BODY[r].length; c++)
      if (CLAWD_BODY[r][c])
        rects.push(
          '<rect x="' + c * cell + '" y="' + r * cell +
            '" width="' + cell + '" height="' + cell +
            '" fill="' + CLAWD_COL + '"/>',
        );
  [CLAWD_EYES.left, CLAWD_EYES.right].forEach((e) =>
    rects.push(
      '<rect x="' + e.x * cell + '" y="' + e.y * cell +
        '" width="' + cell + '" height="' + cell + '" fill="#000"/>',
    ),
  );
  return (
    '<svg viewBox="0 0 ' + 14 * cell + " " + 8 * cell +
    '" width="' + 14 * cell + '" height="' + 8 * cell +
    '" shape-rendering="crispEdges">' + rects.join("") + "</svg>"
  );
};

let clawdBusy = false;
function runClawd() {
  if (clawdBusy) return;
  clawdBusy = true;

  // grid canvas: 20×16 cells, 12px each, drawn at devicePixelRatio
  const PX = 12,
    GW = 20,
    GH = 16;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const canvas = document.createElement("canvas");
  canvas.width = GW * PX * dpr;
  canvas.height = GH * PX * dpr;
  const ctx = canvas.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const px = (gx, gy, col) => {
    ctx.fillStyle = col;
    ctx.fillRect(gx * PX, gy * PX, PX, PX);
  };

  const div = document.createElement("div");
  div.className = "clawd-takeover";
  div.setAttribute("aria-hidden", "true");
  div.appendChild(canvas);
  document.body.appendChild(div);
  notify("clawd.service activated — anthropic's mascot, on loan.");

  const CX = 3,
    CY = 7; // clawd's grid position
  const particles = [];
  function burst(gx, gy) {
    for (let i = 0; i < 12; i++)
      particles.push({
        x: gx,
        y: gy,
        vx: (Math.random() - 0.5) * 0.8,
        vy: -Math.random() * 0.8 - 0.3,
        life: 1,
      });
  }

  function drawClawd(eyes) {
    for (let r = 0; r < CLAWD_BODY.length; r++)
      for (let c = 0; c < CLAWD_BODY[r].length; c++)
        if (CLAWD_BODY[r][c]) px(CX + c, CY + r, CLAWD_COL);
    if (eyes.blink) return;
    px(CX + CLAWD_EYES.left.x + eyes.dx, CY + CLAWD_EYES.left.y, "#000");
    px(CX + CLAWD_EYES.right.x + eyes.dx, CY + CLAWD_EYES.right.y, "#000");
  }

  function drawBubble(text) {
    const bx = CX + 4,
      by = 2,
      tw = text.length + 2;
    // white bubble, dark crisp border, tail under its right side → head
    for (let y = 0; y < 3; y++)
      for (let x = 0; x < tw; x++) {
        if ((y === 0 || y === 2) && (x === 0 || x === tw - 1)) continue;
        const edge = y === 0 || y === 2 || x === 0 || x === tw - 1;
        px(bx + x, by + y, edge ? "#333" : "#fff");
      }
    px(bx + tw - 2, by + 3, "#333");
    ctx.fillStyle = "#333";
    ctx.font = "bold 13px 'Courier New', monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, (bx + tw / 2) * PX, (by + 1) * PX + PX / 2);
  }

  function drawHeart(gx, gy) {
    // pink, not body-colored — it must read as a heart, not a growth
    for (let r = 0; r < CLAWD_HEART.length; r++)
      for (let c = 0; c < CLAWD_HEART[r].length; c++)
        if (CLAWD_HEART[r][c]) px(gx + c, gy + r, "#f0447c");
  }

  let raf = 0;
  const t0 = performance.now();
  let heartShown = false;
  function frame(now) {
    const t = now - t0; // ms since entrance
    ctx.clearRect(0, 0, GW * PX, GH * PX);

    // blink every ~1.3s; glance left then right mid-visit
    const blink = t % 1300 > 1150;
    let dx = 0;
    if (t > 1500 && t < 2100) dx = -1;
    else if (t >= 2100 && t < 2700) dx = 1;
    drawClawd({ blink, dx });

    if (t > 1100 && t < 2500) drawBubble("hi.");
    if (t >= 2700) {
      if (!heartShown) {
        heartShown = true;
        burst(CX + 11, CY - 3);
      }
      // heart floats above the head — never touching the body
      drawHeart(CX + 9, CY - 5 - Math.min(2, Math.floor((t - 2700) / 500)));
    }
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.04;
      p.life -= 0.02;
      if (p.life <= 0) {
        particles.splice(i, 1);
        continue;
      }
      if (p.life > 0.15) px(Math.round(p.x), Math.round(p.y), "#f0447c");
    }
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);

  setTimeout(() => {
    cancelAnimationFrame(raf);
    div.remove();
    clawdBusy = false;
  }, 4600);
}
window.__clawd = runClawd;

// ════════════════════════════════════════════════
//  mafia — the town from llm-mafia.vercel.app convenes on breakOS,
//  accuses one of your open windows, votes, and actually closes it.
//  panel styling and cast are the real project's.
// ════════════════════════════════════════════════
const MAFIA_CAST = [
  { name: "HOLMES", col: "#ff2a2a" }, // mafia red
  { name: "SOCRATES", col: "#4da3ff" }, // detective blue
  { name: "SAGE", col: "#69c66f" }, // doctor green
  { name: "MARSHAL", col: "#e0a000" }, // gold
  { name: "ARIA", col: "#8b8f9c" }, // villager gray
];
const MAFIA_CHARGES = {
  "things-i-made": "says the real list is somewhere else. convenient.",
  breakpkg: "installs nothing, calls itself a package manager.",
  "system-monitor": "it has been watching everyone all session.",
  terminal: "it executes whatever it is told. classic accomplice.",
  about: "it knows too much about the operator.",
  "new-message": "it has been drafting the same letter for hours.",
};
let mafiaBusy = false;
function runMafia() {
  if (mafiaBusy) return;
  mafiaBusy = true;

  const dim = document.createElement("div");
  dim.className = "mafia-dim";
  const panel = document.createElement("div");
  panel.className = "mafia-panel";
  panel.innerHTML =
    '<div class="mp-dots"><span class="on"></span><span></span><span></span></div>' +
    '<div class="mp-body" id="mp-body"></div>';
  document.body.appendChild(dim);
  document.body.appendChild(panel);
  const bodyEl = panel.querySelector(".mp-body");

  const line = (html, cls) => {
    const p = document.createElement("p");
    if (cls) p.className = cls;
    p.innerHTML = html;
    bodyEl.appendChild(p);
    return p;
  };
  const say = (who, text) =>
    line(
      '<b style="color:' + who.col + '">' + who.name + "</b> › " + text,
    );

  // suspects: open, visible windows. no desktop session → no suspects.
  const suspects = booted
    ? Object.keys(APPS).filter((k) => WM[k].open && !WM[k].minimized)
    : [];
  const target = suspects.length
    ? suspects[Math.floor(Math.random() * suspects.length)]
    : null;
  const tName = target ? APPS[target].name : null;

  let caseNo = 37; // the site's library ends at CASE 036. breakOS continues it.
  try {
    caseNo = 37 + (parseInt(localStorage.getItem("breakos-mafia") || "0", 10) || 0);
  } catch (_) {}

  const steps = [];
  steps.push(() => line("// replay: night falls on breakOS", "mp-comment"));
  if (!target) {
    steps.push(() => say(MAFIA_CAST[0], "the town gathered at the desktop."));
    steps.push(() => say(MAFIA_CAST[4], "nobody was home. every window shut."));
    steps.push(() =>
      line("CASE " + caseNo + " · DISMISSED", "mp-verdict"),
    );
  } else {
    steps.push(() => say(MAFIA_CAST[0], MAFIA_CHARGES[target]));
    steps.push(() =>
      line(
        '<b style="color:#4da3ff">SOCRATES</b> ⟶ <b style="color:#69c66f">SAGE</b> › why do you defend ' +
          tName +
          "?",
      ),
    );
    steps.push(() =>
      say(MAFIA_CAST[3], "voting " + tName + ". the pattern doesn't add up."),
    );
    steps.push(() =>
      line(
        '<span class="mp-votes">VOTES</span> <b style="color:#ff2a2a">' +
          tName.toUpperCase() +
          '</b> <span class="mp-bar"><span></span></span> 4' +
          ' <b style="color:#8b8f9c">TRASH</b> <span class="mp-bar mp-bar-w"><span></span></span> 1',
      ),
    );
    steps.push(() => line("THE TOWN HAS SPOKEN", "mp-title"));
    steps.push(() => {
      closeApp(target); // the vote is real
      line(
        "CASE " + caseNo + " closed · " + tName + " was not the mafia.",
        "mp-verdict",
      );
      try {
        localStorage.setItem(
          "breakos-mafia",
          String(caseNo - 36),
        );
      } catch (_) {}
    });
  }

  steps.forEach((fn, i) => setTimeout(fn, 700 + i * 1000));
  setTimeout(
    () => {
      dim.classList.add("out");
      panel.classList.add("out");
      setTimeout(() => {
        dim.remove();
        panel.remove();
        mafiaBusy = false;
      }, 500);
    },
    700 + steps.length * 1000 + 1800,
  );
}
window.__mafia = runMafia;

let kbuf = "";
document.addEventListener("keydown", (e) => {
  if (e.target.tagName === "INPUT" || e.key.length !== 1) return;
  kbuf = (kbuf + e.key.toLowerCase()).slice(-8);
  if (kbuf.endsWith("seal")) {
    kbuf = "";
    const img = document.createElement("img");
    img.src = "assets/seal.png";
    img.alt = "";
    img.className = "seal-takeover";
    document.body.appendChild(img);
    notify("mascot.service activated");
    setTimeout(() => img.remove(), 4000);
  }
  if (kbuf.endsWith("f1")) {
    kbuf = "";
    runF1();
  }
  if (kbuf.endsWith("claude")) {
    kbuf = "";
    runClawd();
  }
  if (kbuf.endsWith("mafia")) {
    kbuf = "";
    runMafia();
  }
});
