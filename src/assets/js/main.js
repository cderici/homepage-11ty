// Small enhancements for the new layout. Loaded as a module (deferred);
// the pages work without it.

// Lightbox: a link marked data-lightbox opens its image in a native <dialog>.
// Links sharing a data-lightbox="name" form a gallery: arrows, arrow keys and
// swipes step through it, and data-title becomes the caption. The open/close
// animation is CSS (@starting-style); Esc closes it natively.
const lightbox = document.querySelector("dialog.lightbox");
if (lightbox) {
  const img = lightbox.querySelector("img");
  const caption = lightbox.querySelector(".lb-caption");
  const count = lightbox.querySelector(".lb-count");
  let group = [];
  let index = 0;

  const preload = (link) => { const i = new Image(); i.src = link.href; return i; };

  // show photo i of the group once it has decoded, so it never pops in half-drawn
  const show = (i) => {
    index = (i + group.length) % group.length;
    const link = group[index];
    return preload(link).decode().catch(() => {}).then(() => {
      if (group[index] !== link) return;  // a newer step won the race
      img.src = link.href;
      img.alt = link.querySelector("img")?.alt ?? "";
      caption.textContent = link.dataset.title ?? "";
      count.textContent = group.length > 1 ? `${index + 1} / ${group.length}` : "";
      if (lightbox.open) img.animate([{ opacity: 0.35 }, { opacity: 1 }], { duration: 140, easing: "ease-out" });
      if (group.length > 1) [index + 1, index - 1].forEach((j) => preload(group[(j + group.length) % group.length]));
    });
  };

  const open = (link) => {
    const name = link.dataset.lightbox;
    group = name ? [...document.querySelectorAll(`a[data-lightbox="${CSS.escape(name)}"]`)] : [link];
    lightbox.classList.toggle("multi", group.length > 1);
    link.setAttribute("aria-busy", "true");
    show(group.indexOf(link)).finally(() => {
      link.removeAttribute("aria-busy");
      lightbox.showModal();
    });
  };

  let swiped = false;
  document.addEventListener("click", (e) => {
    const link = e.target.closest("a[data-lightbox]");
    if (link) {
      // let ctrl/cmd/shift/middle clicks open the image in a new tab as usual
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey) return;
      e.preventDefault();
      open(link);
    }
  });

  lightbox.addEventListener("click", (e) => {
    if (swiped) { swiped = false; return; }
    if (e.target.closest(".lb-prev")) show(index - 1);
    else if (e.target.closest(".lb-next")) show(index + 1);
    else lightbox.close();  // the photo, the backdrop or the close button
  });

  lightbox.addEventListener("keydown", (e) => {
    if (group.length < 2) return;
    if (e.key === "ArrowLeft") { e.preventDefault(); show(index - 1); }
    if (e.key === "ArrowRight") { e.preventDefault(); show(index + 1); }
  });

  // horizontal swipe on touch screens
  let startX = null;
  lightbox.addEventListener("pointerdown", (e) => { startX = e.pointerType === "mouse" ? null : e.clientX; });
  lightbox.addEventListener("pointerup", (e) => {
    if (startX === null || group.length < 2) return;
    const dx = e.clientX - startX;
    startX = null;
    if (Math.abs(dx) > 40) { swiped = true; show(index + (dx < 0 ? 1 : -1)); }
  });
}

// Click-to-load video players: swap the preview for the real player.
document.addEventListener("click", (e) => {
  const preview = e.target.closest("button.facade");
  if (!preview) return;
  const player = document.createElement("iframe");
  player.src = preview.dataset.src;
  player.title = preview.dataset.title;
  player.allow = "autoplay; encrypted-media; picture-in-picture; fullscreen";
  player.allowFullscreen = true;
  preview.replaceWith(player);
  player.focus();
});

// A link to a collapsed section (e.g. #edu-phd-indiana) opens it: on click,
// on hash changes (back/forward), and when the page loads with that hash.
const openDetails = (hash) => {
  const el = hash.length > 1 && document.getElementById(decodeURIComponent(hash.slice(1)));
  if (el instanceof HTMLDetailsElement) el.open = true;
};
document.addEventListener("click", (e) => {
  const a = e.target.closest('a[href^="#"]');
  if (a) openDetails(a.hash);
});
addEventListener("hashchange", () => openDetails(location.hash));
openDetails(location.hash);

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
