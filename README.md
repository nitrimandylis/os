<div align="center">

```
 ██████╗ ██████╗ ███████╗ █████╗ ██╗  ██╗ ██████╗ ███████╗
 ██╔══██╗██╔══██╗██╔════╝██╔══██╗██║ ██╔╝██╔═══██╗██╔════╝
 ██████╔╝██████╔╝█████╗  ███████║█████╔╝ ██║   ██║███████╗
 ██╔══██╗██╔══██╗██╔══╝  ██╔══██║██╔═██╗ ██║   ██║╚════██║
 ██████╔╝██║  ██║███████╗██║  ██║██║  ██╗╚██████╔╝███████║
 ╚═════╝ ╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝╚═╝  ╚═╝ ╚═════╝ ╚══════╝
```

### `night shift: running breakOS v4. it builds. it breaks. it drags.`

*my old portfolio, disguised as an operating system. it works nights at [os.nicktrim.com](https://os.nicktrim.com); the day job went to [nicktrim.com](https://nicktrim.com). you boot it by scrolling. then it becomes a real desktop.*

![status](https://img.shields.io/badge/status-definitely_stable-f25c4a?style=flat-square)
![build](https://img.shields.io/badge/build_step-none._we_ship_raw-8a8a8a?style=flat-square)
![frameworks](https://img.shields.io/badge/frameworks-0-e6e6e6?style=flat-square)
![mascot](https://img.shields.io/badge/mascot-seal_(non--negotiable)-262626?style=flat-square)
![windows](https://img.shields.io/badge/windows-draggable._finally-f25c4a?style=flat-square)

</div>

---

> [!WARNING]
> This portfolio contains a fully working `rm -rf /`. It does exactly what
> you'd hope. The blue screen is included free of charge. You can also drag
> files into the trash. The OS will not let you.

## 🖥️ What is this

A developer portfolio that takes the phrase *"personal site"* literally:
it's an entire (fictional) operating system. You **scroll to boot it** —
the boot log prints *true diagnostics* about your actual page load — and
when boot hits 100%, the page stops being a page. It becomes a **desktop**:
windows drag, stack, minimize to a real taskbar, and launch from icons or
a start menu. The icons drag too — single click selects, double-click
launches, and an empty patch of desk gives you a marquee. Where you leave
things is where they stay. On phones you get **breakOS Mobile**, the scroll edition,
because the mobile version of any OS is always slightly worse. That is
canon.

```console
guest@breakos:~$ whoami
guest. the OS belongs to nick trimandylis — python · typescript · swift.
builds things useful or interesting, ideally both.
```

## 🪟 The apps

| | app | what it actually does |
|---|---|---|
| ⏻ | **boot log** | scroll-scrubbed; every line is a real measurement of *your* browser. that's the joke — it's all true |
| ▤ | **`~/things-i-made`** | the leftovers: `todo_FINAL.txt`, `ideas_3am.md`, `node_modules` and friends. `the_real_list.url` opens [nicktrim.com/work](https://nicktrim.com/work). drag any of them to the trash to be told no |
| ▦ | **breakpkg** | package manager for the CLI family: every public repo tagged `cli` on GitHub, fetched **live**. the list keeps itself |
| ◔ | **System Monitor** | my repos, fetched **live** from the GitHub API as processes — real sizes as memory, real push times as uptime, plus *your* actual FPS |
| ▮ | **terminal** | a working shell. `help`, `pkg list`, `defrag`, `sudo hire-nick`, `vim` (good luck quitting). `man juke` fetches the CLI's **actual man page** from its repo and renders it |
| ◍ | **About This Computer** | processor: `1 × human, runs warm under deadline`. known issues: `starts side projects at 1am. will not patch` |
| ⏻ | **start menu → Shut down?** | `[Yes]` `[Also Yes]` → BSOD → `stop code: VISITOR_ATTEMPTED_TO_LEAVE` → reboots you to the boot log |

## 🚀 Run it

```bash
git clone https://github.com/nitrimandylis/os.git
cd os
python3 -m http.server     # → http://localhost:8000
```

No `npm install`. No build. No `node_modules` folder heavier than the
concept of regret. Three CDN script tags and a dream.

## 🧠 How it works

```mermaid
flowchart LR
    A[you scroll] --> B[boot log prints<br/>real diagnostics]
    B --> C{100% booted?}
    C -->|desktop| D[real WM: drag, z-order,<br/>minimize, start menu]
    C -->|mobile| E[scroll session<br/>breakOS Mobile]
    D --> F[GitHub API<br/>streams live data]
    F --> G{shut down?}
    G -->|Yes| H[💙 BSOD]
    G -->|Also Yes| H
    H --> A
```

| layer | file | job |
|---|---|---|
| 🎨 design system | `css/breakos.css` | nicktrim.com's man(1) palette: black, one grey, flat 1px windows. coral for focus and selection |
| 🌊 live wallpaper | `js/wallpaper.js` | canvas halftone dots reacting to scroll — now with `defrag` support |
| ⏻ boot | `js/boot.js` | honest boot log (`performance` + `navigator`, zero fiction), hands off to the desktop |
| 🪟 window manager | `js/os.js` | drag, z-order, minimize/maximize, taskbar switcher, start menu, trash, BSOD, easter eggs |
| ▦ packages | `js/breakpkg.js` | the CLI registry: repos tagged `cli`, from the same GitHub fetch as the monitor |
| 📊 monitor | `js/monitor.js` | GitHub repos as processes + real FPS/uptime |
| ▮ shell | `js/terminal.js` | the command parser. yes, `rm -rf /` is wired up |

**Type stack:** [VT323](https://fonts.google.com/specimen/VT323) for OS chrome ·
[JetBrains Mono](https://www.jetbrains.com/lp/mono/) for everything else, the
same font nicktrim.com is set in. type `exit` in the terminal to go back there.

## 🥚 Easter eggs

<details>
<summary><b>spoilers — earn them honestly or click here</b></summary>

- open the browser console → the kernel has opinions about you
- type <kbd>s</kbd><kbd>e</kbd><kbd>a</kbd><kbd>l</kbd> anywhere → `mascot.service` deploys
- type <kbd>f</kbd><kbd>1</kbd> anywhere → five red lights. you know what happens when they go out
- type <kbd>c</kbd><kbd>l</kbd><kbd>a</kbd><kbd>u</kbd><kbd>d</kbd><kbd>e</kbd> anywhere → clawd, the pixel crab, rises from the taskbar to blink, say hi, and leave a heart
- scroll the boot too fast → the OS files a complaint
- terminal: `claude` → an interactive Claude Code session. scripted, zero tokens, full attitude. it will ask permission to use Bash. deny it
- type <kbd>m</kbd><kbd>a</kbd><kbd>f</kbd><kbd>i</kbd><kbd>a</kbd> anywhere → night falls, and the town from [LLM-Mafia](https://llm-mafia.vercel.app) convenes to accuse one of your **open windows**. the vote is real: it closes. cases continue the library's numbering
- drag a file into the trash → the OS declines, and counts your attempts
- terminal: `defrag` → the wallpaper tidies itself up, then admits nothing moved
- terminal: `sudo hire-nick` → generates an offer letter addressed to me
- terminal: `rm -rf /` → finds out
- terminal: `vim` → you know what happens
- switch tabs → the title sulks: *"breakOS — suspended (it'll keep)"*
- the shutdown dialog counts your boots — using *your own* localStorage. I track nobody; you surveil yourself

</details>

## 🗿 Archaeology

`v1/` holds the previous design — dark "organic brutalism" with a GLSL
simplex-noise shader. v2 was the scroll-only OS. v3 made the windows real. v4 went on the night shift.
We honor our ancestors; we do not load them.

---

<div align="center">

**[Nick Trimandylis](https://github.com/nitrimandylis)** · [nicktrim8@duck.com](mailto:nicktrim8@duck.com)

*yes, the email is a duck* 🦆

MIT licensed — take anything. it's a portfolio, that's the point.

</div>
