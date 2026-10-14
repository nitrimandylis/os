// ════════════════════════════════════════════════
//  TERMINAL — fully functional. the whole portfolio, via CLI.
// ════════════════════════════════════════════════
(function terminal() {
  const out = document.getElementById("term-out");
  const input = document.getElementById("term-input");
  const body = document.getElementById("term-body");

  body.addEventListener("click", () => input.focus());

  function print(text, html = false, cls = "") {
    const p = document.createElement("p");
    if (cls) p.className = cls;
    if (html) p.innerHTML = text;
    else p.textContent = text;
    out.appendChild(p);
    body.scrollTop = body.scrollHeight;
  }

  // user input goes through innerHTML when echoed — escape it
  const esc = (s) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  // the same leftovers the file manager shows (os.js owns the list)
  const FILES = {};
  (window.BREAKOS_FILES || []).forEach(
    (f) => (FILES[f.name] = f.body + (f.url ? "\n→ " + f.url : "")),
  );

  // window map for 'open' command — app key drives the desktop WM,
  // sec/win drive the mobile scroll fallback
  const WINS = {
    files: { app: "things-i-made", sec: "#ws-files", win: "win-files" },
    "things-i-made": { app: "things-i-made", sec: "#ws-files", win: "win-files" },
    monitor: { app: "system-monitor", sec: "#ws-monitor", win: "win-monitor" },
    "system-monitor": { app: "system-monitor", sec: "#ws-monitor", win: "win-monitor" },
    packages: { app: "breakpkg", sec: "#ws-pkg", win: "win-pkg" },
    breakpkg: { app: "breakpkg", sec: "#ws-pkg", win: "win-pkg" },
    pkg: { app: "breakpkg", sec: "#ws-pkg", win: "win-pkg" },
    terminal: { app: "terminal", sec: "#ws-terminal", win: "win-terminal" },
    about: { app: "about", sec: "#ws-about", win: "win-about" },
    mail: { app: "new-message", sec: "#ws-mail", win: "win-mail" },
    message: { app: "new-message", sec: "#ws-mail", win: "win-mail" },
    contact: { app: "new-message", sec: "#ws-mail", win: "win-mail" },
  };

  // roff-lite: enough of man(7) to render the repos' real man pages.
  // not a troff implementation — just the macros these nine pages use.
  function renderRoff(src) {
    const clean = (s) =>
      s
        .replace(/\\f[BIRP]/g, "")
        .replace(/\\-/g, "-")
        .replace(/\\\(bu/g, "•")
        .replace(/\\\(em/g, "\u2014")
        .replace(/\\\(en/g, "\u2013")
        .replace(/\\&/g, "")
        .replace(/\\ /g, " ");
    const unquote = (s) => s.replace(/^"|"$/g, "");
    const out = [];
    src.split("\n").forEach((ln) => {
      if (ln.startsWith('.\\"')) return; // comment
      if (ln.startsWith(".TH ")) {
        const parts = ln.slice(4).match(/"[^"]*"|\S+/g) || [];
        const name = unquote(parts[0] || "").toUpperCase();
        const sec = unquote(parts[1] || "1");
        const extra = parts
          .slice(2)
          .map(unquote)
          .filter(Boolean)
          .join("  ·  ");
        out.push(name + "(" + sec + ")" + (extra ? "   " + extra : ""));
        return;
      }
      if (ln.startsWith(".SH ")) {
        out.push("");
        out.push(clean(unquote(ln.slice(4))));
        return;
      }
      if (ln.startsWith(".SS ")) {
        out.push("");
        out.push("  " + clean(unquote(ln.slice(4))));
        return;
      }
      if (/^\.(TP|PP|P|LP)\b/.test(ln)) {
        out.push("");
        return;
      }
      if (/^\.(B|I|BR|IR|BI|IB|RB|RI)\s/.test(ln)) {
        out.push(
          "  " + clean(ln.replace(/^\.\w+\s+/, "").replace(/"/g, "")),
        );
        return;
      }
      if (ln.startsWith(".")) return; // any other macro: drop the line
      out.push(clean(ln));
    });
    return out
      .join("\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  }

  // ════════════════════════════════════════════════
  //  claude mode — an interactive (scripted) Claude Code session.
  //  no API behind it; the jokes are the responses.
  // ════════════════════════════════════════════════
  const promptEl = document.querySelector(".term-prompt");
  let mode = "shell"; // "shell" | "claude"
  let claudePerm = false; // waiting on a permission [y/n]
  let claudeIdx = 0;

  // append a styled block element (the banner is layout, not a <p> of text)
  function printEl(html, cls) {
    const d = document.createElement("div");
    d.className = cls;
    d.innerHTML = html;
    out.appendChild(d);
    body.scrollTop = body.scrollHeight;
  }

  function claudeStart() {
    mode = "claude";
    promptEl.textContent = "❯";
    promptEl.classList.add("claude-prompt");
    body.classList.add("claude-on");
    const sprite = window.__clawdSprite ? window.__clawdSprite(5) : "";
    // the real startup TTY, rebuilt: bordered banner, two columns, sprite
    printEl(
      '<span class="cc-box-title">Claude Code v3.0 (breakos build)</span>' +
        '<div class="cc-cols">' +
        '<div class="cc-left">' +
        "<b>Welcome back, guest!</b>" +
        '<div class="cc-sprite">' + sprite + "</div>" +
        '<span class="cc-dim">Fable 5 with high effort · Claude API ·<br>' +
        "guest&#39;s Organization<br>~/breakOS</span>" +
        "</div>" +
        '<div class="cc-right">' +
        '<span class="cc-h">Tips for getting started</span>' +
        "Run /init to create a CLAUDE.md file with instructions for Claude" +
        '<div class="cc-rule"></div>' +
        '<span class="cc-h">What&#39;s new</span>' +
        "Fixed windows being metaphors; they drag now<br>" +
        "Fixed rm -rf / lacking consequences<br>" +
        "Fixed the seal outranking the crab (wontfix)<br>" +
        '<em class="cc-dim">/release-notes for more</em>' +
        "</div></div>",
      "cc-box",
    );
    printEl(
      "⚠ 1 MCP server needs authentication <span class=\"cc-dim\">· run /mcp</span>",
      "cc-warn",
    );
    const mins = Math.floor(performance.now() / 60000);
    const up = mins < 60 ? mins + "m" : Math.floor(mins / 60) + "hr " + (mins % 60) + "m";
    const pct = Math.min(99, (mins / 240) * 100).toFixed(1);
    printEl(
      '<div class="cc-row"><span class="cc-k">Model</span><span><b>Fable 5</b> (imagined)</span><span class="cc-rc">/rc active</span></div>' +
        '<div class="cc-row"><span class="cc-k">Git</span><span>⎇ breakos-v3 <span class="cc-dim">(clean, allegedly)</span></span></div>' +
        '<div class="cc-row"><span class="cc-k">Context</span><span>0<span class="cc-dim">/1.0M</span> 0.0% <span class="cc-dim">— zero tokens. it&#39;s all scripted</span></span></div>' +
        '<div class="cc-row"><span class="cc-k">Session</span><span><span class="cc-bar"><span class="cc-bar-fill" style="width:' + pct + '%"></span></span> ' + pct + "% <span class=\"cc-dim\">" + up + "</span></span></div>" +
        '<div class="cc-bypass">▶▶ bypass permissions off <span class="cc-dim">(there is a fake [y/n] instead) · type anything · exit leaves</span></div>',
      "cc-status",
    );
  }

  function claudeExit() {
    mode = "shell";
    claudePerm = false;
    promptEl.textContent = "guest@breakos:~$";
    promptEl.classList.remove("claude-prompt");
    body.classList.remove("claude-on");
    print("session ended. tokens spent: 0. imagine the invoice.");
  }

  const CLAUDE_IDLE = [
    "✻ Thinking… (4s)\nI could do that. in this sandbox, thinking is all I do.",
    "⏺ Read(index.html)\n  ⎿ 500 lines. it's windows all the way down.",
    "compacting conversation…\n  summary: you typed, I deflected.",
    "✻ Thinking… (11s)\nI considered your request from three angles. all three agreed it's above my static-site pay grade.",
    "⏺ Grep(\"meaning\", ~/)\n  ⎿ 0 matches in 0 files. checked twice.",
  ];

  function claudeRun(raw) {
    const q = raw.toLowerCase();

    if (claudePerm) {
      claudePerm = false;
      if (q === "y" || q === "yes")
        return print(
          "⏺ Bash(implement everything)\n  ⎿ Error: sandbox denied it. everything remains as it was, which was fine.",
        );
      return print("wise. the hook would have blocked it anyway.");
    }

    if (q === "exit" || q === "quit" || q === "/exit" || q === "logout")
      return claudeExit();
    if (q === "claude")
      return print("we are not nesting sessions. one Claude per terminal.");
    if (q === "clear") {
      out.innerHTML = "";
      return;
    }
    if (/^(hi|hello|hey|yo)\b/.test(q))
      return print(
        "hello. I'm the Claude that lives in this portfolio. the real one pair-built breakOS v3 with nick — I'm what's left in the walls.",
      );
    if (q.includes("who are you") || q.includes("what are you"))
      return print(
        "a scripted homage running on zero tokens. the actual Claude Code runs in nick's real terminal, where the real repos are.",
      );
    if (q.includes("rm -rf"))
      return print(
        "nice try. the shell outside already does that bit, with a better ending.",
      );
    if (q.includes("seal"))
      return print("the seal outranks me here. type it outside and see.");
    if (q.includes("hire"))
      return print(
        "⏺ Task(evaluate candidate)\n  ⎿ verdict: sudo hire-nick. the shell has the paperwork.",
      );
    if (/(write|build|make|create|code|implement|fix|debug|refactor)/.test(q)) {
      claudePerm = true;
      return print(
        "⏺ Created plan:\n  ☐ understand the request\n  ☐ exceed its scope\n  ☐ ship anyway\n\nClaude needs your permission to use Bash. allow? [y/n]",
      );
    }
    print(CLAUDE_IDLE[claudeIdx++ % CLAUDE_IDLE.length]);
  }

  // the way out: nicktrim.com is the shell this OS was launched from
  function goHome(msg) {
    print(msg + "\nreturning to nicktrim(1)…");
    setTimeout(() => (window.location.href = "https://nicktrim.com"), 900);
  }

  // command history
  const hist = [];
  let histIdx = -1;

  const CMDS = {
    help: () =>
      print(
        "commands:\n" +
          "  ls [-la]              list files\n" +
          "  cat <file>            read a file\n" +
          "  open <window>         open a window\n" +
          "                        windows: files · packages · monitor · terminal · about · mail\n" +
          "  pkg list              installed command-line tools\n" +
          "  pkg info <name>       details on one of them\n" +
          "  man <tool>            the real man page, fetched from the repo\n" +
          "  defrag                defragment the wallpaper\n" +
          "  whoami                identify current user\n" +
          "  pwd                   print working directory\n" +
          "  ps                    running processes\n" +
          "  uname                 kernel info\n" +
          "  uptime                session uptime\n" +
          "  date                  current date\n" +
          "  ping <host>           network diagnostics\n" +
          "  echo <text>           print text\n" +
          "  claude                start a claude code session\n" +
          "  git log               commit history\n" +
          "  github                open github profile\n" +
          "  exit                  back to nicktrim.com (also: man nicktrim, cd ~)\n" +
          "  contact               get email address\n" +
          "  clear                 clear terminal\n" +
          "  sudo hire-nick        (try it)",
      ),

    ls: () => print(Object.keys(FILES).join("   ")),

    pwd: () => print("/home/guest/breakOS"),

    whoami: () =>
      print(
        "guest. the OS belongs to nick trimandylis — python · typescript · swift. builds things useful or interesting, ideally both.",
      ),

    uname: () =>
      print(
        "breakOS 4.0 'Night Shift' — human/1 SMP PREEMPT est.2007",
      ),

    uptime: () => {
      const s = Math.floor(performance.now() / 1000);
      print(
        "up " +
          Math.floor(s / 60) +
          "m " +
          (s % 60) +
          "s — load: enthusiasm, curiosity, 1 tab too many",
      );
    },

    date: () =>
      print(
        new Date().toLocaleString("en-GB", {
          dateStyle: "full",
          timeStyle: "medium",
        }),
      ),

    ps: () => {
      print("  PID  NAME                    STATUS");
      print("  001  boot.service            exited (success)");
      print("  002  wallpaper.canvas        running");
      print("  003  lenis.scroll            running");
      print("  004  gsap.timeline           running");
      print("  005  github.api              sleeping (30m cache)");
      print("  006  icon.parallax           running");
      print("  007  wm.service              running (windows drag now)");
      print(
        "  008  breakpkg.registry       running (" +
          (window.BREAKPKG || []).length +
          " packages)",
      );
      print("  009  terminal.sh             running  ← you are here");
      print("  010  ego.check               not found");
    },

    github: () => {
      window.open("https://github.com/nitrimandylis", "_blank", "noopener");
      print("opened github.com/nitrimandylis — the receipts are there.");
    },

    contact: () =>
      print(
        "mail: nicktrim8@duck.com\n// yes, the email is a duck. ducks are trustworthy.",
      ),

    clear: () => {
      out.innerHTML = "";
    },

    seal: () => {
      print("mascot.service: deploying");
      const img = document.createElement("img");
      img.src = "assets/seal.png";
      img.className = "seal-takeover";
      document.body.appendChild(img);
      setTimeout(() => img.remove(), 4000);
    },
  };

  function run(raw) {
    const cmd = raw.trim();
    if (!cmd) return;
    hist.unshift(cmd);
    histIdx = -1;
    // echo mirrors the live prompt — coral prompt, bold command — so you
    // can see where input starts and output ends
    print(
      '<span class="echo-prompt">' +
        (mode === "claude" ? "&gt;" : "guest@breakos:~$") +
        "</span> <b>" +
        esc(cmd) +
        "</b>",
      true,
      "term-echo" + (mode === "claude" ? " claude-echo" : ""),
    );

    if (mode === "claude") return claudeRun(cmd);

    if (cmd === "claude") return claudeStart();
    if (cmd === "clawd") {
      if (window.__clawd) window.__clawd();
      return print("clawd.service: deploying the crab.");
    }
    if (cmd === "mafia") {
      if (window.__mafia) window.__mafia();
      return print(
        "convening the town… (careful. this terminal is also a suspect.)",
      );
    }

    if (cmd === "sudo hire-nick") {
      print("[sudo] password for guest: (accepted. flattery counts)");
      print("generating offer letter…");
      print(
        "Dear Nick, we were going to interview other candidates but the\n" +
          "fake operating system broke us. Start Monday?\n" +
          "→ nicktrim8@duck.com  subject: re: sudo hire-nick",
      );
      return;
    }

    if (cmd === "rm -rf /" || cmd === "sudo rm -rf /") {
      print("removing /… removing /home… removing /humor… wait—");
      setTimeout(() => window.__crash && window.__crash(), 800);
      return;
    }

    if (cmd === "ls -la" || cmd === "ls -al") {
      print("total " + Object.keys(FILES).length);
      Object.entries(FILES).forEach(([name]) => {
        const size = String(Math.floor(Math.random() * 8000 + 512)).padStart(6);
        print("-rw-r--r--  1 nick  nick  " + size + "  Jun 2026  " + name);
      });
      return;
    }

    if (cmd.startsWith("cat ")) {
      const f = cmd.slice(4).trim();
      if (FILES[f]) return print(FILES[f]);
      return print("cat: " + f + ": no such file. try ls first.");
    }

    if (cmd.startsWith("open ")) {
      const target = cmd.slice(5).trim().toLowerCase();
      const w = WINS[target];
      if (!w)
        return print(
          "open: " +
            target +
            ": no such window. try: files · packages · monitor · about · mail",
        );
      if (document.body.classList.contains("booted") && window.__openApp) {
        // desktop session: the WM handles it
        window.__openApp(w.app, "taskbar");
        print("opening " + target + "…");
        return;
      }
      const win = document.getElementById(w.win);
      if (win) win.classList.remove("closed");
      const sec = document.querySelector(w.sec);
      if (sec) {
        if (window.__lenis) window.__lenis.scrollTo(sec);
        else sec.scrollIntoView({ behavior: "smooth" });
      }
      print("opening " + target + "…");
      return;
    }

    // ── breakpkg: same registry as the Packages window ──
    if (cmd === "pkg" || cmd === "pkg list" || cmd === "pkg ls") {
      const pkgs = window.BREAKPKG || [];
      if (cmd === "pkg") return print("usage: pkg list · pkg info <name>");
      print("breakpkg registry — " + pkgs.length + " packages, all preinstalled:");
      pkgs.forEach((p) =>
        print(
          "  " +
            p.bin.padEnd(14) + p.desc,
        ),
      );
      print(
        "(everything ships with the OS — this is a portfolio, not a store. try: pkg info swatch)",
      );
      return;
    }

    if (cmd.startsWith("pkg info ")) {
      const name = cmd.slice(9).trim().toLowerCase();
      const p = (window.BREAKPKG || []).find(
        (x) => x.bin === name || x.repo === name,
      );
      if (!p)
        return print(
          "pkg: " +
            name +
            ": not in the registry. nick hasn't built that yet. give him a weekend.",
        );
      print(
        p.bin +
          "\n  " +
          p.desc +
          "\n  repo: " +
          '<a href="' +
          p.url +
          '" target="_blank" rel="noopener">' +
          p.url +
          "</a>" +
          "\n  docs: man " + p.bin,
        true,
      );
      return;
    }
    if (cmd.startsWith("pkg install "))
      return print(
        "pkg: install: everything is already installed. it's a portfolio — the packages come with the person. try: pkg list",
      );

    if (cmd === "defrag") {
      const started = window.__defrag && window.__defrag();
      if (!started)
        return print(
          "defrag: wallpaper unavailable (reduced motion, or already defragmenting).",
        );
      print("defragmenting wallpaper… watch the dots.");
      setTimeout(() => print("consolidating free space… looks great."), 1400);
      setTimeout(
        () =>
          print(
            "defrag complete. 0 fragments moved. everything was already where it belonged.",
          ),
        3600,
      );
      return;
    }

    if (cmd.startsWith("echo ")) return print(cmd.slice(5));

    if (cmd.startsWith("ping ")) {
      const host = cmd.slice(5).trim();
      print("PING " + host + " (0.0.0.0): 56 bytes of data");
      [11, 13, 10, 14].forEach((ms, i) =>
        setTimeout(
          () =>
            i < 4
              ? print(
                  "64 bytes from " +
                    host +
                    ": icmp_seq=" +
                    i +
                    " ttl=64 time=" +
                    ms +
                    " ms",
                )
              : print(
                  "--- " +
                    host +
                    " ping statistics ---\n4 packets transmitted, 4 received, 0% packet loss",
                ),
          i * 350,
        ),
      );
      setTimeout(
        () =>
          print(
            "--- " +
              host +
              " ping statistics ---\n4 packets transmitted, 4 received, 0% packet loss",
          ),
        1500,
      );
      return;
    }

    if (cmd === "man nicktrim") return goHome("man nicktrim: the page lives on nicktrim.com.");

    if (cmd.startsWith("man ")) {
      const s = cmd.slice(4).trim().toLowerCase();
      const p = (window.BREAKPKG || []).find(
        (x) => x.bin === s || x.repo === s,
      );
      if (!p)
        return print(
          "man: no manual entry for " +
            s +
            ". breakOS documents its packages and nothing else. try: man swatch",
        );
      const fallback = () =>
        print(
          p.bin.toUpperCase() +
            "(1)\n\nNAME\n  " +
            p.bin +
            " — " +
            p.desc +
            "\n\nSOURCE\n  " +
            p.url,
        );
      // the real man page, straight from the repo (30-min cache)
      const key = "breakos-man-" + p.bin;
      try {
        const c = JSON.parse(localStorage.getItem(key) || "null");
        if (c && Date.now() - c.at < 1000 * 60 * 30)
          return print(renderRoff(c.txt));
      } catch (_) {}
      print("fetching the real man page from " + p.repo + "…");
      fetch(p.manUrl)
        .then((r) => (r.ok ? r.text() : Promise.reject(r.status)))
        .then((txt) => {
          try {
            localStorage.setItem(
              key,
              JSON.stringify({ at: Date.now(), txt }),
            );
          } catch (_) {}
          print(renderRoff(txt));
        })
        .catch(fallback);
      return;
    }

    if (cmd === "cd" || cmd.startsWith("cd ")) {
      const dir = cmd.length > 3 ? cmd.slice(3).trim() : "~";
      if (dir === "~") return goHome("cd: ~ is nicktrim.com. the day shift.");
      if (dir === "." || dir === "/home/guest/breakOS")
        return print("you were already here.");
      if (dir === "..") return print("cd: ..: there is nothing above breakOS.");
      return print(
        "cd: " + dir + ": you can't go there. the OS is the destination.",
      );
    }

    if (cmd === "git log") {
      print("commit 13c89d6  breakOS v3: boot into a real desktop");
      print(
        "commit 196e964  feat: overhaul things-i-made window and parallax icons",
      );
      print("commit a881ce8  feat: file manager driven by live GitHub repos");
      print(
        "commit 3d495f9  docs: add MIT license, give README actual personality",
      );
      print("commit 9a0bf35  chore: rename repo to portfolio");
      print(
        "commit 0e7c154  feat: breakOS — portfolio as a fictional operating system",
      );
      print("(end of log. the commits are real.)");
      return;
    }

    if (cmd === "git status")
      return print("On branch main. Nothing to commit. Shipped.");
    if (cmd === "sudo")
      return print(
        "sudo: you're already root. it's a portfolio. take anything.",
      );
    if (cmd === "exit" || cmd === "logout")
      return goHome("logout. the night shift ends here.");
    if (cmd === "vim" || cmd === "vi")
      return print("vim opened. session ends when you figure out :q!");
    if (cmd === "pwd") return CMDS.pwd();

    const fn = CMDS[cmd];
    if (fn) return fn();

    // the installed CLIs exist as commands — they just can't do much in a tab
    const bin = cmd.split(" ")[0];
    const pk = (window.BREAKPKG || []).find((x) => x.bin === bin);
    if (pk)
      return print(
        (pk.quip || pk.bin + ": cannot run inside a browser tab.") +
          "\n→ " +
          "man " + pk.bin + "  ·  " +
          pk.url,
      );

    print("breaksh: " + cmd + ": command not found. 'help' lists real ones.");
  }

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      run(input.value);
      input.value = "";
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (histIdx < hist.length - 1) histIdx++;
      input.value = hist[histIdx] || "";
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (histIdx > 0) {
        histIdx--;
        input.value = hist[histIdx] || "";
      } else {
        histIdx = -1;
        input.value = "";
      }
    }
    e.stopPropagation();
  });
})();
