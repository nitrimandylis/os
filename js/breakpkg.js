// ════════════════════════════════════════════════
//  BREAKPKG — package manager for the CLI family.
//  the list is every public repo tagged `cli` on github,
//  read from the shared repos fetch. nothing here is hand-kept
//  except the jokes and two bin names that differ from the repo.
//  terminal.js reads window.BREAKPKG for pkg/man commands.
// ════════════════════════════════════════════════
(function breakpkg() {
  // repo name → the command it installs, where they differ
  const BIN = { jukebox: "juke", dovetail: "dt" };

  // what happens when you run the bin inside a browser tab
  const RUN_QUIPS = {
    swatch: "swatch: no desktop surfaces found to theme. ironic, given the surroundings.",
    juke: "juke: Music.app not found in this browser. the silence continues.",
    jazz: "jazz: this terminal cannot render video. it can barely render text.",
    bacpack: "bacpack: no ManageBac session. lucky you.",
    dt: "dt: found 0 dotfiles. this machine is a tab.",
    cine: "cine: no cinemas within reach of this sandbox. Athens has several.",
    "agent-wrapped":
      "agent-wrapped: no transcripts in here. run it on your own machine: bunx @nitrimandylis/agent-wrapped",
    aidetect: "aidetect: no draft supplied. this page is 0 words of coursework.",
    brushwork: "brushwork: give it a photograph. a browser tab is not a photograph.",
    nous: "nous: no markdown vault at this path. the graph is empty and so is the folder.",
    nocturne: "nocturne: no audio device in a browser tab. the building stays dark.",
    shelf: "shelf: 1 repo found on this machine. you are looking at it.",
    lamp: "lamp: no lamp on this network. the night shift works in the dark.",
    deeplarp: "deeplarp: scoring this site… it is a fake operating system. larp score: 100.",
  };

  const relTime = (iso) => {
    const days = Math.floor((Date.now() - new Date(iso)) / 86400000);
    if (days === 0) return "today";
    if (days === 1) return "yesterday";
    if (days < 30) return days + "d ago";
    if (days < 365) return Math.floor(days / 30) + "mo ago";
    return Math.floor(days / 365) + "y ago";
  };

  const PKGS = [];
  window.BREAKPKG = PKGS; // filled once the repos arrive

  const table = document.getElementById("pkg-table");
  const loading = document.getElementById("pkg-loading");
  const status = document.getElementById("pkg-status");

  function render(repos) {
    loading.remove();
    repos
      .filter((r) => !r.fork && (r.topics || []).includes("cli"))
      .sort((a, b) => a.name.localeCompare(b.name))
      .forEach((r) => {
        const bin = BIN[r.name] || r.name;
        const p = {
          bin,
          repo: r.name,
          desc: r.description || "no description. it speaks for itself.",
          url: r.html_url,
          // tried on `man`; a repo without one falls back to the description
          manUrl:
            "https://raw.githubusercontent.com/nitrimandylis/" +
            r.name + "/" + (r.default_branch || "main") + "/man/" + bin + ".1",
          quip: RUN_QUIPS[bin],
        };
        PKGS.push(p);

        const row = document.createElement("a");
        row.className = "pkgrow pkgpkg";
        row.href = p.url;
        row.target = "_blank";
        row.rel = "noopener";
        const name = document.createElement("span");
        name.className = "pkg-name";
        name.textContent = bin;
        const lang = document.createElement("span");
        lang.textContent = r.language || "vibes";
        const pushed = document.createElement("span");
        pushed.textContent = relTime(r.pushed_at);
        const desc = document.createElement("span");
        desc.className = "pkg-desc";
        desc.textContent = p.desc;
        row.append(name, lang, pushed, desc);
        table.appendChild(row);
      });
    status.textContent =
      PKGS.length + " packages · 0 vulnerabilities · audited by vibes";
  }

  function fail() {
    loading.textContent =
      "registry unreachable. github is on a break. the packages exist: github.com/nitrimandylis";
  }

  window.BREAKOS_REPOS.then(render).catch(fail);
})();
