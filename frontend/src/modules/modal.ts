/**
 * Wires up the two modals from the design: the "Play Video" popup and the
 * "Learn More" text popup. Both share the same open/close mechanics.
 */
export function initModals(): void {
  wireModal("play-video-btn", "video-modal", {
    onOpen: () => {
      const video = document.getElementById("modal-video") as HTMLVideoElement | null;
      video?.play().catch(() => {
        /* Autoplay with sound can be blocked; the user can press play manually. */
      });
    },
    onClose: () => {
      const video = document.getElementById("modal-video") as HTMLVideoElement | null;
      video?.pause();
    }
  });

  wireModal("learn-more-btn", "learn-more-modal", {});
}

interface ModalHooks {
  onOpen?: () => void;
  onClose?: () => void;
}

function wireModal(triggerId: string, modalId: string, hooks: ModalHooks): void {
  const trigger = document.getElementById(triggerId);
  const modal = document.getElementById(modalId);
  if (!trigger || !modal) return;

  const open = (): void => {
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    hooks.onOpen?.();
  };

  const close = (): void => {
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    hooks.onClose?.();
  };

  trigger.addEventListener("click", open);
  modal.querySelectorAll<HTMLElement>("[data-close-modal]").forEach((el) => {
    el.addEventListener("click", close);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && modal.classList.contains("is-open")) close();
  });
}
