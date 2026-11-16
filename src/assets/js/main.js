// Small enhancements for the new layout. Loaded as a module (deferred);
// the pages work without it.

// Lightbox: a link marked data-lightbox opens its image in a native <dialog>.
// The open/close animation is CSS (@starting-style); Esc closes it natively.
const lightbox = document.querySelector("dialog.lightbox");
const lightboxImg = lightbox?.querySelector("img");

document.addEventListener("click", (e) => {
  const link = e.target.closest("a[data-lightbox]");
  if (link && lightbox) {
    // let ctrl/cmd/shift/middle clicks open the image in a new tab as usual
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey) return;
    e.preventDefault();
    lightboxImg.src = link.href;
    lightboxImg.alt = link.querySelector("img")?.alt ?? "";
    // open once the image is ready, so it animates in whole rather than popping in
    link.setAttribute("aria-busy", "true");
    lightboxImg.decode().catch(() => {}).finally(() => {
      link.removeAttribute("aria-busy");
      lightbox.showModal();
    });
  } else if (lightbox?.open && e.target.closest("dialog.lightbox")) {
    lightbox.close();
  }
});

// Back to top: shown once the nav has scrolled out of view.
const toTop = document.querySelector(".to-top");
const nav = document.querySelector(".site-nav");
if (toTop && nav) {
  new IntersectionObserver(([entry]) => {
    toTop.classList.toggle("show", !entry.isIntersecting && entry.boundingClientRect.top < 0);
  }).observe(nav);
  toTop.addEventListener("click", () => {
    const smooth = !matchMedia("(prefers-reduced-motion: reduce)").matches;
    scrollTo({ top: 0, behavior: smooth ? "smooth" : "instant" });
    nav.querySelector("a")?.focus({ preventScroll: true });
  });
}

// Pause the frame light while a frame is off screen; no point animating it.
const frames = document.querySelectorAll(".frame");
if (frames.length) {
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) e.target.classList.toggle("idle", !e.isIntersecting);
  });
  frames.forEach((f) => io.observe(f));
}
