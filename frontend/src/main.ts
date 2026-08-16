import { initNavigation } from "./modules/navigation";
import { initModals } from "./modules/modal";
import { initGoogleAuth } from "./modules/googleAuth";
import { initCryptoTicker } from "./modules/cryptoTicker";

function bootstrap(): void {
  initNavigation();
  initModals();
  initGoogleAuth();
  initCryptoTicker();
  initAuthTabs();
  initAddCoinMenu();
}

/** Sign In / Enter Email tabs — switches which panel is shown. */
function initAuthTabs(): void {
  const tabs = document.querySelectorAll<HTMLButtonElement>(".auth-tab");
  const panels: Record<string, HTMLElement | null> = {
    signin: document.getElementById("auth-signin"),
    email: document.getElementById("auth-email"),
  };
  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      tabs.forEach((t) => {
        t.classList.remove("is-active");
        t.setAttribute("aria-selected", "false");
      });
      tab.classList.add("is-active");
      tab.setAttribute("aria-selected", "true");

      const target = tab.dataset.tab ?? "signin";
      const signedIn = document.getElementById("auth-user");
      const isSignedIn = signedIn ? !signedIn.hidden : false;
      if (isSignedIn) return;

      Object.entries(panels).forEach(([key, panel]) => {
        if (!panel) return;
        panel.hidden = key !== target;
      });
    });
  });
}

/** "Add a Cryptocurrency" dropdown — visual only, no coin is actually added. */
function initAddCoinMenu(): void {
  const btn = document.getElementById("add-coin-btn");
  const menu = document.getElementById("add-coin-menu");
  if (!btn || !menu) return;

  btn.addEventListener("click", (event) => {
    event.stopPropagation();
    const isOpen = !menu.hidden;
    menu.hidden = isOpen;
    btn.setAttribute("aria-expanded", String(!isOpen));
  });

  document.addEventListener("click", (event) => {
    if (!menu.hidden && !menu.contains(event.target as Node) && event.target !== btn) {
      menu.hidden = true;
      btn.setAttribute("aria-expanded", "false");
    }
  });
}

document.addEventListener("DOMContentLoaded", bootstrap);
