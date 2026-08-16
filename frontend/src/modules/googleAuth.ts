import type { GoogleProfile } from "../types";

const BACKEND_URL: string = (import.meta.env.VITE_BACKEND_URL as string | undefined) ?? "http://localhost:8000";
const STORAGE_KEY = "kairos.googleProfile";

/**
 * The "Google" button in the auth card starts a standard OAuth2 Authorization
 * Code flow: the browser is sent to our backend, which redirects to Google,
 * and Google redirects back to the backend, which finally redirects to this
 * page with the profile encoded in the query string. We read it once, store
 * it in localStorage so a refresh keeps the signed-in state, and clean the
 * URL with history.replaceState.
 */
export function initGoogleAuth(): void {
  const signInBtn = document.getElementById("google-signin-btn");
  const signOutBtn = document.getElementById("sign-out-btn");

  signInBtn?.addEventListener("click", () => {
    const returnTo = window.location.origin + window.location.pathname;
    window.location.href = `${BACKEND_URL}/auth/google/login?redirect_uri=${encodeURIComponent(returnTo)}`;
  });

  signOutBtn?.addEventListener("click", () => {
    localStorage.removeItem(STORAGE_KEY);
    renderProfile(null);
  });

  const fromRedirect = readProfileFromQuery();
  if (fromRedirect) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(fromRedirect));
    stripAuthParamsFromUrl();
    renderProfile(fromRedirect);
    return;
  }

  const cached = readProfileFromStorage();
  renderProfile(cached);
}

function readProfileFromQuery(): GoogleProfile | null {
  const params = new URLSearchParams(window.location.search);
  if (params.get("auth") !== "success") return null;

  const name = params.get("name");
  const email = params.get("email");
  const picture = params.get("picture");
  if (!name || !email) return null;

  return { name, email, picture: picture ?? "" };
}

function readProfileFromStorage(): GoogleProfile | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as GoogleProfile) : null;
  } catch {
    return null;
  }
}

function stripAuthParamsFromUrl(): void {
  const url = new URL(window.location.href);
  ["auth", "name", "email", "picture"].forEach((key) => url.searchParams.delete(key));
  window.history.replaceState({}, document.title, url.pathname + url.search + url.hash);
}

function renderProfile(profile: GoogleProfile | null): void {
  const signedOutView = document.getElementById("auth-signin");
  const signedInView = document.getElementById("auth-user");
  const avatar = document.getElementById("auth-user-avatar") as HTMLImageElement | null;
  const nameEl = document.getElementById("auth-user-name");
  const emailEl = document.getElementById("auth-user-email");
  if (!signedOutView || !signedInView || !avatar || !nameEl || !emailEl) return;

  if (profile) {
    signedOutView.hidden = true;
    signedInView.hidden = false;
    avatar.src = profile.picture || fallbackAvatar(profile.name);
    avatar.alt = profile.name;
    nameEl.textContent = profile.name;
    emailEl.textContent = profile.email;
  } else {
    signedOutView.hidden = false;
    signedInView.hidden = true;
  }
}

function fallbackAvatar(name: string): string {
  const initial = name.trim().charAt(0).toUpperCase() || "?";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="42" height="42"><rect width="100%" height="100%" fill="#3a1f78"/><text x="50%" y="55%" font-family="Arial" font-size="18" fill="#fff" text-anchor="middle">${initial}</text></svg>`;
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}
