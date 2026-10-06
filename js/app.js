// Navigation is driven by the URL hash so every view is linkable and the
// browser Back button works:
//   (no hash)  -> landing hero
//   #menu      -> table of contents
//   #<page>    -> a page panel (e.g. #about, #projects)
document.addEventListener("DOMContentLoaded", () => {
  const hero = document.querySelector(".hero-fullscreen");
  const tocOverlay = document.getElementById("tocOverlay");
  const pageOverlay = document.getElementById("pageOverlay");
  const pageContent = document.getElementById("pageContent");
  const panels = new Map(
    [...document.querySelectorAll(".page-panel")].map((p) => [p.dataset.page, p])
  );
  const baseTitle = document.title;
  const CLOSE_MS = 550; // matches .page-overlay transition
  let closeTimer = null;
  let pendingHighlight = null;
  let firstRender = true;
  pageOverlay.inert = true;

  function currentKey() {
    return decodeURIComponent(location.hash.slice(1));
  }

  function clearHash() {
    history.pushState(null, "", location.pathname + location.search);
    render();
  }

  function showPanel(panel) {
    clearTimeout(closeTimer);
    panels.forEach((p) => { p.hidden = p !== panel; });

    // Load report PDFs only when their panel is opened
    panel.querySelectorAll("iframe[data-src]").forEach((frame) => {
      if (!frame.getAttribute("src")) frame.src = frame.dataset.src;
    });

    if (pageContent) pageContent.scrollTop = 0;
    pageOverlay.classList.add("open");
    pageOverlay.inert = false;

    const heading = panel.querySelector(".section-heading");
    document.title = heading ? `${heading.textContent.trim()} – ${baseTitle}` : baseTitle;
    const back = panel.querySelector(".page-back-btn");
    if (back && !firstRender) back.focus({ preventScroll: true });

    if (pendingHighlight) {
      const id = pendingHighlight;
      pendingHighlight = null;
      requestAnimationFrame(() => highlightProject(id));
    }
  }

  function closePage() {
    if (!pageOverlay.classList.contains("open")) return;
    pageOverlay.classList.remove("open");
    pageOverlay.inert = true;
    document.title = baseTitle;
    // Hide panels once the slide-out finishes (timer, not transitionend, so
    // reduced-motion and bubbled child transitions can't break it)
    clearTimeout(closeTimer);
    closeTimer = setTimeout(() => {
      if (!pageOverlay.classList.contains("open")) panels.forEach((p) => { p.hidden = true; });
    }, CLOSE_MS);
  }

  function highlightProject(id) {
    const target = document.getElementById(id);
    if (!target || target.hidden) return;
    target.scrollIntoView({ behavior: "smooth", block: "center" });
    target.classList.add("project-highlight");
    setTimeout(() => target.classList.remove("project-highlight"), 2000);
  }

  function render() {
    const key = currentKey();
    const panel = panels.get(key);
    const tocOpen = key !== "";
    const wasTocOpen = tocOverlay.classList.contains("open");

    tocOverlay.classList.toggle("open", tocOpen);
    tocOverlay.inert = !tocOpen;

    if (panel) {
      showPanel(panel);
    } else {
      closePage();
      if (firstRender) {
        // leave focus where the browser put it
      } else if (tocOpen) {
        const first = tocOverlay.querySelector(".toc-row");
        if (first && !wasTocOpen) first.focus({ preventScroll: true });
      } else if (hero) {
        hero.focus({ preventScroll: true });
      }
    }
    firstRender = false;
  }

  // ===== Landing: click / Enter / Space opens the menu =====
  if (hero) {
    const openMenu = () => { location.hash = "menu"; };
    hero.addEventListener("click", openMenu);
    hero.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        openMenu();
      }
    });
  }

  // ===== "See projects" refs that point at a card in the projects grid =====
  document.querySelectorAll("[data-goto-project]").forEach((ref) => {
    ref.addEventListener("click", () => {
      pendingHighlight = ref.dataset.gotoProject;
    });
  });

  // ===== Escape steps back one level =====
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    const key = currentKey();
    if (panels.has(key)) {
      location.hash = key.startsWith("report-") ? "projects" : "menu";
    } else if (key) {
      clearHash();
    }
  });

  window.addEventListener("hashchange", render);

  // First render without slide animations (e.g. when opening a deep link)
  document.body.classList.add("no-anim");
  render();
  requestAnimationFrame(() => requestAnimationFrame(() => document.body.classList.remove("no-anim")));
});
