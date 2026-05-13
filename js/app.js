document.addEventListener("DOMContentLoaded", () => {
  const hero = document.querySelector(".hero-fullscreen");
  const tocOverlay = document.getElementById("tocOverlay");
  const pageOverlay = document.getElementById("pageOverlay");

  const allPanels = document.querySelectorAll(".page-panel");

  // ===== Auto-prefer PNG over SVG for project thumbs; hide card if no PNG exists =====
  document.querySelectorAll(".project-thumb").forEach((thumb) => {
    const bg = thumb.style.backgroundImage;
    const svgMatch = bg.match(/url\(['"]?(.*\.svg)['"]?\)/i);
    const pngMatch = bg.match(/url\(['"]?(.*\.png)['"]?\)/i);

    let pngUrl;
    if (svgMatch) {
      pngUrl = svgMatch[1].replace(/\.svg$/i, ".png");
    } else if (pngMatch) {
      pngUrl = pngMatch[1];
    } else {
      return;
    }

    const card = thumb.closest(".project-card");
    const img = new Image();
    img.onload = () => { thumb.style.backgroundImage = `url('${pngUrl}')`; };
    img.onerror = () => { if (card) card.hidden = true; };
    img.src = pngUrl;
  });

  // ===== Landing: click anywhere to slide up TOC =====
  if (hero && tocOverlay) {
    hero.style.cursor = "pointer";
    hero.addEventListener("click", () => tocOverlay.classList.add("open"));
  }

  // ===== TOC links: show embedded panel & slide in from right =====
  document.querySelectorAll(".toc-row[data-page]").forEach((link) => {
    link.style.cursor = "pointer";
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const key = link.getAttribute("data-page");
      if (!key || !pageOverlay) return;

      // Hide all panels, show the matching one
      allPanels.forEach((p) => p.hidden = true);
      const target = document.querySelector('.page-panel[data-page="' + key + '"]');
      if (target) target.hidden = false;

      // Slide in
      pageOverlay.scrollTop = 0;
      pageOverlay.classList.remove("closing");
      pageOverlay.classList.add("open");
    });
  });

  // ===== Back button: slide page out to the right =====
  function closePage() {
    if (!pageOverlay) return;
    pageOverlay.classList.add("closing");
    pageOverlay.classList.remove("open");

    pageOverlay.addEventListener("transitionend", function handler() {
      pageOverlay.removeEventListener("transitionend", handler);
      pageOverlay.classList.remove("closing");
      allPanels.forEach((p) => p.hidden = true);
    });
  }

  // ===== Project reference links: navigate to specific project =====
  document.querySelectorAll("[data-goto-project]").forEach((ref) => {
    ref.addEventListener("click", (e) => {
      e.preventDefault();
      const projectId = ref.getAttribute("data-goto-project");
      if (!projectId || !pageOverlay) return;

      // Switch to projects panel
      allPanels.forEach((p) => p.hidden = true);
      const projectsPanel = document.querySelector('.page-panel[data-page="projects"]');
      if (projectsPanel) projectsPanel.hidden = false;

      // Scroll to specific project and highlight
      requestAnimationFrame(() => {
        const target = document.getElementById(projectId);
        if (target) {
          target.scrollIntoView({ behavior: "smooth", block: "center" });
          target.classList.add("project-highlight");
          setTimeout(() => target.classList.remove("project-highlight"), 2000);
        }
      });
    });
  });

  // ===== Back buttons (one per panel, delegated) =====
  pageOverlay.addEventListener("click", (e) => {
    if (e.target.matches(".page-back-btn")) {
      e.preventDefault();
      closePage();
    }
  });

  // ===== Escape key =====
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      if (pageOverlay && pageOverlay.classList.contains("open")) {
        closePage();
      } else if (tocOverlay && tocOverlay.classList.contains("open")) {
        tocOverlay.classList.remove("open");
      }
    }
  });
});
