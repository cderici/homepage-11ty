// Old/new look switch: crossfade only when switching designs (in browsers
// with cross-document view transitions); every other navigation stays
// instant. Runs in <head> so `pagereveal` is caught before the first paint.
(() => {
  const KEY = "look-switch";
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const flagged = () => { try { return sessionStorage.getItem(KEY) === "1"; } catch { return false; } };
  // skipping rejects the transition's promises; mark them handled so nothing is logged
  const skip = (vt) => {
    for (const k of ["ready", "finished", "updateCallbackDone"]) vt[k]?.catch(() => {});
    vt.skipTransition();
  };
  addEventListener("pageswap", (e) => {
    if (e.viewTransition && (reduce || !flagged())) skip(e.viewTransition);
  });
  addEventListener("pagereveal", (e) => {
    const switching = flagged();
    try { sessionStorage.removeItem(KEY); } catch {}
    if (e.viewTransition && (reduce || !switching)) skip(e.viewTransition);
  });
  addEventListener("click", (e) => {
    if (e.target.closest?.(".look-switch")) { try { sessionStorage.setItem(KEY, "1"); } catch {} }
  }, true);
})();
