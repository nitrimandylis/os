# breakOS — night shift (os.nicktrim.com)

Static site, no build step. The old portfolio, styled as a fictional operating
system ("breakOS"), now linked from nicktrim.com as "night shift". Rule: it
keeps no hand-synced facts; anything factual is fetched or links to nicktrim.com.
Serve with `python3 -m http.server` for local dev; opening
`index.html` directly also works.

## Architecture

Two modes, one markup, decided once per page load at the 720px breakpoint:

- **Desktop (>720px)**: scroll drives only the boot log. At 100% boot,
  `boot.js` calls `window.__enterDesktop()` (os.js): body gets `.booted`,
  scroll locks, windows are adopted into a fixed `#stage` and managed by a
  real window manager — drag by titlebar, z-order on pointerdown anywhere in
  a window, minimize/maximize/close, taskbar app switcher, start menu,
  shutdown modal. `exitDesktop()` (via BSOD reboot) reverses all of it.
- **Mobile (≤720px)**: the original linear scroll session, untouched — windows
  in `.ws` sections, drift-in on scroll, close-to-tray buttons.

Files:

- `index.html` — all markup: boot section, six `.window` sections (files,
  monitor, breakpkg, terminal, about, mail), desktop icons (app launchers,
  decor, functional trash), start menu (incl. back to nicktrim.com), shutdown
  dialog + `#sd-modal` shell, taskbar, file-detail overlay, f1 lights, BSOD
  overlay.
- `css/breakos.css` — single stylesheet. Design tokens in `:root` match
  nicktrim.com's man(1) page: `--paper`/`--win` #000, `--ink` #e6e6e6,
  `--ink-soft` #8a8a8a, `--line` #262626, and one accent, `--coral` #f25c4a,
  used only for focus and selection (active title bar, ::selection, selected
  icons, marquee, active task, menu hover). Windows are flat 1px `--line`
  panes, no bevels or drop shadows. The eggs (mafia, f1, claude TTY) keep
  their borrowed palettes as literal hexes. The v3 desktop block sits above
  the 720px "breakOS Mobile" media query.
- `js/os.js` — core: Lenis smooth scroll, the window manager (`APPS`/`WM`,
  `openApp`/`closeApp`/`minimizeApp`/`focusApp`; maximize parks inline
  left/top in `st.premax`, dragging a maximized titlebar unsnaps it), the
  desktop icon system (single click selects, double-click opens, drag with
  positions persisted to `breakos-icons-v1` as vw/vh, background marquee;
  no parallax — parallax used to scrub icons off-screen), boot→desktop
  handoff, the file manager (`window.BREAKOS_FILES`: six fixed joke files,
  `the_real_list.url` opens nicktrim.com/work; the terminal and trash read the
  same list), trash drag with attempt
  counter (`breakos-trash-attempts`), f1 + seal + claude + mafia cheat codes
  (clawd renders the canonical pixel grid on a canvas, `window.__clawd`; the
  mafia night phase uses llm-mafia.vercel.app's shell tokens and cast, and
  its vote closes a real open window via `closeApp` — case numbers continue
  the site's library from 037, `breakos-mafia`), shutdown → BSOD → reboot,
  toasts.
  Shared GitHub fetch lives here as `window.BREAKOS_REPOS` (30-min cache,
  `breakos-repos-v1`).
- `js/boot.js` — scroll-scrubbed boot log; lines computed from real
  diagnostics (`performance`, `navigator`). Keep lines truthful — that's the
  joke. Fires `__enterDesktop` at progress ≈ 1.
- `js/breakpkg.js` — the CLI-family registry (`window.BREAKPKG`, filled
  async): every public non-fork repo whose GitHub topics include `cli`, from
  `BREAKOS_REPOS`. Desc is the GitHub description. `BIN` maps repos whose
  command differs (jukebox → juke, dovetail → dt). `manUrl` always points at
  `man/<bin>.1` on the default branch; terminal `man` falls back to the
  description when it 404s. `RUN_QUIPS` holds the refusal joke per bin.
- `js/monitor.js` — GitHub repos as "processes"; real FPS/uptime; the third
  stat is scroll depth on mobile and open-window count on the desktop
  (`window.__winCount`).
- `js/terminal.js` — command parser. Add commands to `CMDS` or as cases in
  `run()`. `FILES` (its `ls`/`cat` filesystem) is built from
  `window.BREAKOS_FILES`; `open` routes through `window.__openApp` when booted; `pkg
  list`/`pkg info` read `window.BREAKPKG` (there is no `pkg install` —
  everything is preinstalled, that's the joke); `man <bin>` fetches the
  repo's real `man/<bin>.1` (30-min cache, `breakos-man-<bin>`) and renders
  it via `renderRoff` (a roff-lite formatter, only the macros those pages
  use); typing a bin name runs its deadpan refusal quip; `defrag` calls
  `window.__defrag`; `claude` enters a scripted interactive Claude Code
  mode (`mode` state machine, keyword-matched responses + a fake permission
  flow — no API behind it, keep it that way). Its startup renders a
  recreation of the real Claude Code TTY (`.cc-*` classes: bordered banner,
  clawd sprite via `window.__clawdSprite`, status block with a real-uptime
  session bar), and the prompt becomes a terracotta `❯` with a pink caret.
- `js/wallpaper.js` — canvas halftone dots in `--line` grey; scroll velocity
  feeds dot size and drift. `window.__defrag()` packs the dots into a grid
  and releases them (guarded against resize mid-run).
- `v1/` — previous design + original prototype. Frozen; do not edit or load
  from the new site.

## Libraries

GSAP 3.12 + ScrollTrigger, Lenis 1.0 — CDN `<script>` tags at the bottom of
`index.html`. Load order matters: libs → wallpaper → os → boot → monitor →
breakpkg → terminal (terminal reads `window.BREAKOS_FILES` at load and
`window.BREAKPKG` per command).

## Conventions

- Tone of all copy: deadpan, self-aware, never random. Jokes must emerge from
  a real working feature (the BSOD reboots, the stats are real, the terminal
  executes, the trash counts). No popup-spam gags. No fake version numbers.
  No hand-kept facts either: fetch it or link to nicktrim.com.
- Honor `prefers-reduced-motion` (`REDUCED` flag in os.js) for any new
  animation. UI enters ~200ms strong ease-out from scale ≈ .94; exits faster
  (~140ms); animate transform/opacity only.
- VT323 for OS chrome text; JetBrains Mono (self-hosted, the same file as
  nicktrim.com) for body copy and data. Favicon is nicktrim.com's. og.png
  renders from tools/og.html at 1200x630.
- The boot screen opens like nicktrim.com: `nick@athens ~` title line, then
  `❯ night-shift`. Terminal `exit`, `logout`, `cd ~` and `man nicktrim` go
  back to nicktrim.com.
- No frameworks, no build tooling — keep it static.
- Local CSS/JS are linked with `?v=<version>` in index.html. Pages caches them
  for 10 minutes, so bump the version on every change to css/ or js/, or a
  returning visitor gets new HTML with the old stylesheet.

## Verify changes

`node --check js/*.js` for syntax; then serve and check both modes:

- **Desktop (>720px)**: scroll the boot to 100% — desktop must take over
  (scroll locks, boot screen hidden, files window auto-opens). Drag a
  window; maximize one (must fill the stage, body must wheel-scroll), drag
  its titlebar (must unsnap), close it maximized and reopen (must come back
  normal with a □ glyph). Drag an icon (position must survive reload),
  marquee-select a few. Run `pkg list` (one row per `cli`-tagged repo) /
  `pkg info dt` / `man juke` (real man page) / `swatch` (refusal quip) /
  `defrag` in the terminal, drag a file card to the trash (counter
  increments, file survives), type `f1`, then start menu → shut down →
  BSOD → reboot must land back on a scrollable boot log.
- **Mobile (≤720px)**: linear scroll session — boot completes, windows drift
  in, close-to-tray works, minimize buttons hidden.
