"""
KAIROS backend — Google OAuth2 (Authorization Code flow).

Per the assignment, no session/database layer is required: the backend's
only job is to broker the OAuth2 handshake with Google and hand the
resulting profile back to the frontend as plain query parameters. State is
kept in a short-lived in-memory dict just to carry the frontend's return
URL across the redirect to Google and back — nothing is persisted.
"""
from __future__ import annotations

import os
import secrets
import time
import urllib.parse

import requests
from dotenv import load_dotenv
from flask import Flask, redirect, request, jsonify
from flask_cors import CORS

load_dotenv()

GOOGLE_CLIENT_ID = os.environ["GOOGLE_CLIENT_ID"]
GOOGLE_CLIENT_SECRET = os.environ["GOOGLE_CLIENT_SECRET"]
BACKEND_PUBLIC_URL = os.environ.get("BACKEND_PUBLIC_URL", "http://localhost:8000")
DEFAULT_FRONTEND_URL = os.environ.get("FRONTEND_URL", "http://localhost:5173")

GOOGLE_AUTH_ENDPOINT = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token"
GOOGLE_USERINFO_ENDPOINT = "https://www.googleapis.com/oauth2/v3/userinfo"
CALLBACK_PATH = "/auth/google/callback"

STATE_TTL_SECONDS = 600
# state -> (frontend_redirect_uri, created_at). In-memory by design: no DB.
_pending_states: dict[str, tuple[str, float]] = {}

app = Flask(__name__)
CORS(app, origins=[DEFAULT_FRONTEND_URL], supports_credentials=False)


def _prune_expired_states() -> None:
    now = time.time()
    expired = [s for s, (_, created) in _pending_states.items() if now - created > STATE_TTL_SECONDS]
    for s in expired:
        _pending_states.pop(s, None)


@app.get("/health")
def health() -> tuple[dict, int]:
    return {"status": "ok"}, 200


@app.get("/auth/google/login")
def google_login():
    """Step 1: send the browser to Google's consent screen."""
    _prune_expired_states()

    frontend_redirect_uri = request.args.get("redirect_uri", DEFAULT_FRONTEND_URL)
    state = secrets.token_urlsafe(24)
    _pending_states[state] = (frontend_redirect_uri, time.time())

    params = {
        "client_id": GOOGLE_CLIENT_ID,
        "redirect_uri": f"{BACKEND_PUBLIC_URL}{CALLBACK_PATH}",
        "response_type": "code",
        "scope": "openid email profile",
        "state": state,
        "access_type": "online",
        "prompt": "select_account",
    }
    return redirect(f"{GOOGLE_AUTH_ENDPOINT}?{urllib.parse.urlencode(params)}")


@app.get(CALLBACK_PATH)
def google_callback():
    """Step 2: Google redirects back here with a one-time code."""
    error = request.args.get("error")
    state = request.args.get("state", "")
    code = request.args.get("code")

    frontend_redirect_uri, _ = _pending_states.pop(state, (DEFAULT_FRONTEND_URL, 0.0))

    if error or not code:
        return redirect(f"{frontend_redirect_uri}?auth=error&reason={urllib.parse.quote(error or 'missing_code')}")

    token_response = requests.post(
        GOOGLE_TOKEN_ENDPOINT,
        data={
            "code": code,
            "client_id": GOOGLE_CLIENT_ID,
            "client_secret": GOOGLE_CLIENT_SECRET,
            "redirect_uri": f"{BACKEND_PUBLIC_URL}{CALLBACK_PATH}",
            "grant_type": "authorization_code",
        },
        timeout=10,
    )
    if not token_response.ok:
        return redirect(f"{frontend_redirect_uri}?auth=error&reason=token_exchange_failed")

    access_token = token_response.json().get("access_token")

    userinfo_response = requests.get(
        GOOGLE_USERINFO_ENDPOINT,
        headers={"Authorization": f"Bearer {access_token}"},
        timeout=10,
    )
    if not userinfo_response.ok:
        return redirect(f"{frontend_redirect_uri}?auth=error&reason=userinfo_failed")

    profile = userinfo_response.json()
    query = urllib.parse.urlencode(
        {
            "auth": "success",
            "name": profile.get("name", ""),
            "email": profile.get("email", ""),
            "picture": profile.get("picture", ""),
        }
    )
    return redirect(f"{frontend_redirect_uri}?{query}")


@app.errorhandler(404)
def not_found(_err):
    return jsonify({"error": "not found"}), 404


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    app.run(host="0.0.0.0", port=port, debug=os.environ.get("FLASK_DEBUG") == "1")
