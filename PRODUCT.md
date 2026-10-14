# PRODUCT — breakOS (night shift)

## What it is

The old portfolio, now "night shift" at os.nicktrim.com, linked from
nicktrim.com as night-shift(8). A fictional operating system called breakOS.
Static site, zero build step, vanilla JS + GSAP/Lenis from CDN. The bit is
commitment: the boot log prints real diagnostics, the system monitor and
breakpkg stream real GitHub repos, and every joke grows out of a working
feature. nicktrim.com is the real portfolio; this site keeps no facts that
need hand-syncing.

## Current state (v4, Oct 2026)

- Scroll-scrubbed boot ("night shift_ / running breakOS v4") → real desktop
  session on >720px: draggable windows, z-order, minimize/maximize, taskbar
  app switcher, start menu (with "back to nicktrim.com"), shutdown → BSOD →
  reboot loop. Past the boot screen it is breakOS everywhere.
- Mobile (≤720px) keeps the linear scroll session, branded breakOS Mobile.
- One look, matching nicktrim.com's man(1) page: #000, #e6e6e6, grey #8a8a8a,
  rules #262626, flat 1px windows. Coral #f25c4a is the only accent: focused
  title bar, selection, active task, hover. Theming is gone.
- The file manager holds six fixed joke files; `the_real_list.url` opens
  nicktrim.com/work. The terminal's `ls`/`cat` and the trash use the same list.
- breakpkg is every public, non-fork repo tagged `cli` on GitHub, read from
  the shared repos fetch. A new CLI appears once it carries the topic.
  `man <bin>` tries the repo's man/<bin>.1 and falls back to the description.
- Easter eggs: seal, clawd + the scripted Claude Code session, the mafia night
  phase, f1 start lights, trash-attempt counter, defrag, console kernel,
  rm -rf /, vim.

## Where it's headed

- Nothing scheduled. Tag new CLIs `cli` on GitHub; add a RUN_QUIPS line in
  js/breakpkg.js if it deserves a joke, and a BIN entry if its command name
  differs from the repo name.
- Constraint that will not move: no frameworks, no build step, every stat
  shown must be true, no hand-kept facts.
