# PRODUCT — breakOS (portfolio)

## What it is

Nick's developer portfolio at os.nicktrim.com/, styled as a
fictional operating system called breakOS. Static site, zero build step,
vanilla JS + GSAP/Lenis from CDN. The bit is commitment: the boot log prints
real diagnostics, the system monitor streams real GitHub repos, the package
manager shows a real live npm version, and every joke grows out of a working
feature.

## Current state (v3.1, Sept 2026)

- Scroll-scrubbed boot → real desktop session on >720px: draggable windows,
  z-order, minimize/maximize, taskbar app switcher, start menu, shutdown →
  BSOD → reboot loop.
- Mobile (≤720px) keeps the linear scroll session, branded breakOS Mobile.
- The file manager mirrors the six repos **pinned on GitHub**, in pin order:
  tokenpilot, LLM-Mafia, aidetect, bacpack, gridcast, WhimprFlow. GitHub only serves
  pins through the authenticated GraphQL API, so the list is hand-synced in
  `GALLERY` rather than fetched; changing the pins means editing that array.
  Two of the six are also CLIs and so appear in breakpkg too — the pins win,
  the overlap is deliberate.
- breakpkg window + terminal `pkg`/`man` commands cover the CLI family:
  swatch, juke, jazz, bacpack, dt, cine, agent-wrapped, aidetect, brushwork,
  nous, nocturne, shelf. (sealfetch looked like one but is a wallpaper repo
  — it stays out.)
- Easter eggs: seal, clawd (typed "claude" or the terminal's scripted Claude
  Code session with its recreated startup TTY), the mafia night phase (the
  llm-mafia town votes out an open window), f1 start lights in apex's design
  language, trash-attempt counter, defrag, console kernel, rm -rf /, vim.
- Themes: cream (default), batman-jazz (hand-tuned), plus nine live from the
  swatchbook repo's palette.toml files (night-city, nord, tokyo-night, …).
  `swatch apply <palette>` in the terminal is a working command; the taskbar
  theme button cycles everything. Persisted, flash-free on reload.

## Where it's headed

- Re-sync the file manager whenever the GitHub pins change; the CLI family
  grows in breakpkg (excali, gridwatch and lamp are candidates when they
  mature).
- Possible v3.x: window resize handles, visitor-presence gimmick, a real
  `screensaver` after idle.
- Constraint that will not move: no frameworks, no build step, every stat
  shown must be true.
