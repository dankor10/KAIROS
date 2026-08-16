/**
 * Handles the hamburger menu / mobile navigation drawer seen in the Figma
 * mobile frames: a slide-in panel from the right with a backdrop, closable
 * via the X button, the backdrop, or the Escape key.
 */
export function initNavigation(): void {
  const burgerBtn = document.getElementById("burger-btn");
  const closeBtn = document.getElementById("mobile-nav-close");
  const drawer = document.getElementById("mobile-nav");
  const backdrop = document.getElementById("mobile-nav-backdrop");

  if (!burgerBtn || !closeBtn || !drawer || !backdrop) return;

  const open = (): void => {
    drawer.classList.add("is-open");
    backdrop.classList.add("is-open");
    drawer.setAttribute("aria-hidden", "false");
    burgerBtn.setAttribute("aria-expanded", "true");
    document.body.style.overflow = "hidden";
  };

  const close = (): void => {
    drawer.classList.remove("is-open");
    backdrop.classList.remove("is-open");
    drawer.setAttribute("aria-hidden", "true");
    burgerBtn.setAttribute("aria-expanded", "false");
    document.body.style.overflow = "";
  };

  burgerBtn.addEventListener("click", open);
  closeBtn.addEventListener("click", close);
  backdrop.addEventListener("click", close);

  drawer.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", close);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") close();
  });
}
