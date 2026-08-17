from __future__ import annotations

import json
import os
import secrets
import threading
import urllib.error
import urllib.parse
import urllib.request
from dataclasses import dataclass
from http import HTTPStatus
from http.cookies import SimpleCookie
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any


def load_env_file(path: Path) -> None:
    if not path.is_file():
        return

    for raw_line in path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue

        key, value = line.split("=", 1)
        key = key.strip()
        value = value.strip()
        if len(value) >= 2 and value[0] == value[-1] and value[0] in {'"', "'"}:
            value = value[1:-1]
        os.environ.setdefault(key, value)


APP_DIR = Path(__file__).resolve().parent
load_env_file(APP_DIR.parent.parent / ".env")
load_env_file(APP_DIR / ".env")

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID") or os.getenv("GCP_OAUTH_ID", "")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET") or os.getenv("GCP_OAUTH_SECRET", "")
GOOGLE_HOSTED_DOMAIN = os.getenv("GOOGLE_HOSTED_DOMAIN", "")
PORT = int(os.getenv("BACK_PORT") or os.getenv("PORT", "3000"))

GOOGLE_AUTHORIZE_URL = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_USERINFO_URL = "https://openidconnect.googleapis.com/v1/userinfo"
GOOGLE_SCOPES = "openid email profile"


class ApiError(Exception):
    def __init__(self, status: int, message: str) -> None:
        super().__init__(message)
        self.status = status
        self.message = message


@dataclass(frozen=True)
class Session:
    access_token: str
    refresh_token: str
    user: dict[str, Any]


class SessionStore:
    def __init__(self) -> None:
        self._by_access_token: dict[str, Session] = {}
        self._access_by_refresh_token: dict[str, str] = {}
        self._lock = threading.Lock()

    def issue(self, user: dict[str, Any]) -> Session:
        session = Session(
            access_token=secrets.token_urlsafe(32),
            refresh_token=secrets.token_urlsafe(48),
            user=user,
        )
        with self._lock:
            self._by_access_token[session.access_token] = session
            self._access_by_refresh_token[session.refresh_token] = session.access_token
        return session

    def get(self, access_token: str) -> Session | None:
        with self._lock:
            return self._by_access_token.get(access_token)

    def rotate(self, refresh_token: str) -> Session | None:
        with self._lock:
            access_token = self._access_by_refresh_token.pop(refresh_token, None)
            old_session = self._by_access_token.pop(access_token, None) if access_token else None
        return self.issue(old_session.user) if old_session else None

    def revoke(self, access_token: str) -> None:
        with self._lock:
            session = self._by_access_token.pop(access_token, None)
            if session:
                self._access_by_refresh_token.pop(session.refresh_token, None)


SESSIONS = SessionStore()


def require_google_config() -> None:
    if not GOOGLE_CLIENT_ID or not GOOGLE_CLIENT_SECRET:
        raise ApiError(
            HTTPStatus.SERVICE_UNAVAILABLE,
            "Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET before using Google login.",
        )


def validate_redirect_uri(redirect_uri: str) -> None:
    parsed = urllib.parse.urlparse(redirect_uri)
    is_https = parsed.scheme == "https" and bool(parsed.netloc)
    is_local_http = parsed.scheme == "http" and parsed.hostname in {"localhost", "127.0.0.1"}
    if not (is_https or is_local_http):
        raise ApiError(HTTPStatus.BAD_REQUEST, "redirect_uri must use HTTPS or local HTTP.")


def build_google_login_url(redirect_uri: str) -> str:
    require_google_config()
    validate_redirect_uri(redirect_uri)

    params = {
        "client_id": GOOGLE_CLIENT_ID,
        "redirect_uri": redirect_uri,
        "response_type": "code",
        "scope": GOOGLE_SCOPES,
        "access_type": "online",
        "prompt": "consent",
    }
    if GOOGLE_HOSTED_DOMAIN:
        params["hd"] = GOOGLE_HOSTED_DOMAIN
    return f"{GOOGLE_AUTHORIZE_URL}?{urllib.parse.urlencode(params)}"


def request_json(request: urllib.request.Request) -> dict[str, Any]:
    try:
        with urllib.request.urlopen(request, timeout=10) as response:
            return json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as error:
        try:
            body = json.loads(error.read().decode("utf-8"))
            message = body.get("error_description") or body.get("error")
        except (json.JSONDecodeError, UnicodeDecodeError):
            message = None
        raise ApiError(HTTPStatus.BAD_REQUEST, message or "Google rejected the login code.") from error
    except (urllib.error.URLError, TimeoutError) as error:
        raise ApiError(HTTPStatus.BAD_GATEWAY, "Could not reach Google OAuth.") from error


def exchange_google_code(code: str, redirect_uri: str) -> dict[str, Any]:
    require_google_config()
    validate_redirect_uri(redirect_uri)

    token_request = urllib.request.Request(
        GOOGLE_TOKEN_URL,
        data=urllib.parse.urlencode(
            {
                "code": code,
                "client_id": GOOGLE_CLIENT_ID,
                "client_secret": GOOGLE_CLIENT_SECRET,
                "redirect_uri": redirect_uri,
                "grant_type": "authorization_code",
            }
        ).encode("utf-8"),
        headers={"Content-Type": "application/x-www-form-urlencoded"},
        method="POST",
    )
    google_tokens = request_json(token_request)
    google_access_token = google_tokens.get("access_token")
    if not isinstance(google_access_token, str):
        raise ApiError(HTTPStatus.BAD_REQUEST, "Google did not return an access token.")

    user_request = urllib.request.Request(
        GOOGLE_USERINFO_URL,
        headers={"Authorization": f"Bearer {google_access_token}"},
    )
    user = request_json(user_request)
    if not isinstance(user.get("sub"), str):
        raise ApiError(HTTPStatus.BAD_REQUEST, "Google did not return a valid user.")
    return user


def session_payload(session: Session) -> dict[str, str]:
    return {
        "accessToken": session.access_token,
        "refreshToken": session.refresh_token,
    }


def public_user(user: dict[str, Any]) -> dict[str, str]:
    return {
        key: value
        for key in ("sub", "email", "name", "picture")
        if isinstance((value := user.get(key)), str)
    }


def parse_allowed_origins() -> set[str]:
    origins = {
        origin.strip().rstrip("/")
        for origin in os.getenv("ALLOWED_ORIGINS", "").split(",")
        if origin.strip()
    }
    for domain in os.getenv("ALLOWED_DOMAIN", "").split(","):
        domain = domain.strip().rstrip("/")
        if domain:
            origins.add(domain if "://" in domain else f"http://{domain}")
    return origins


ALLOWED_ORIGINS = parse_allowed_origins()


def is_allowed_origin(origin: str) -> bool:
    if origin in ALLOWED_ORIGINS:
        return True
    if origin.startswith(("chrome-extension://", "moz-extension://")):
        return True
    parsed = urllib.parse.urlparse(origin)
    return parsed.scheme == "http" and parsed.hostname in {"localhost", "127.0.0.1"}


class AjudgeHandler(BaseHTTPRequestHandler):
    server_version = "Ajudge/0.1"

    def do_OPTIONS(self) -> None:
        self.send_response(HTTPStatus.NO_CONTENT)
        self._send_cors_headers()
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Authorization, Content-Type")
        self.send_header("Access-Control-Max-Age", "86400")
        self.end_headers()

    def do_GET(self) -> None:
        self._dispatch("GET")

    def do_POST(self) -> None:
        self._dispatch("POST")

    def _dispatch(self, method: str) -> None:
        parsed = urllib.parse.urlparse(self.path)
        try:
            if method == "GET" and parsed.path == "/health":
                self._success({"ok": True})
                return

            if method == "GET" and parsed.path == "/auth/login/google":
                redirect_uri = urllib.parse.parse_qs(parsed.query).get("redirect_uri", [""])[0]
                if not redirect_uri:
                    raise ApiError(HTTPStatus.BAD_REQUEST, "redirect_uri is required.")
                self._success(build_google_login_url(redirect_uri))
                return

            if method == "POST" and parsed.path == "/auth/login/google/callback":
                body = self._read_json()
                code = body.get("code")
                redirect_uri = body.get("redirect_uri")
                if not isinstance(code, str) or not code:
                    raise ApiError(HTTPStatus.BAD_REQUEST, "code is required.")
                if not isinstance(redirect_uri, str) or not redirect_uri:
                    raise ApiError(HTTPStatus.BAD_REQUEST, "redirect_uri is required.")
                session = SESSIONS.issue(exchange_google_code(code, redirect_uri))
                self._success(session_payload(session), cookies=self._session_cookies(session))
                return

            if method == "POST" and parsed.path == "/auth/refresh":
                body = self._read_json(allow_empty=True)
                refresh_token = body.get("refreshToken") or self._cookie("refresh_token")
                if not isinstance(refresh_token, str) or not refresh_token:
                    raise ApiError(HTTPStatus.UNAUTHORIZED, "Refresh token is required.")
                session = SESSIONS.rotate(refresh_token)
                if not session:
                    raise ApiError(HTTPStatus.UNAUTHORIZED, "Refresh token is invalid.")
                self._success(session_payload(session), cookies=self._session_cookies(session))
                return

            if method == "GET" and parsed.path == "/auth/ping":
                self._require_session()
                self._success("퐁")
                return

            if method == "GET" and parsed.path == "/auth/permission":
                self._require_session()
                self._success({"permissions": []})
                return

            if method == "GET" and parsed.path == "/auth/me":
                self._success(public_user(self._require_session().user))
                return

            if method == "POST" and parsed.path == "/auth/logout":
                access_token = self._access_token()
                self._require_session()
                SESSIONS.revoke(access_token)
                self._success(
                    {"success": True},
                    cookies=[
                        "access_token=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0",
                        "refresh_token=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0",
                    ],
                )
                return

            raise ApiError(HTTPStatus.NOT_FOUND, "Route not found.")
        except ApiError as error:
            self._error(error.status, error.message)
        except (json.JSONDecodeError, UnicodeDecodeError):
            self._error(HTTPStatus.BAD_REQUEST, "Request body must be valid JSON.")
        except Exception:
            self._error(HTTPStatus.INTERNAL_SERVER_ERROR, "Internal server error.")

    def _read_json(self, allow_empty: bool = False) -> dict[str, Any]:
        try:
            length = int(self.headers.get("Content-Length", "0"))
        except ValueError as error:
            raise ApiError(HTTPStatus.BAD_REQUEST, "Invalid Content-Length.") from error
        if length > 64 * 1024:
            raise ApiError(HTTPStatus.REQUEST_ENTITY_TOO_LARGE, "Request body is too large.")
        if length == 0:
            return {} if allow_empty else {}
        body = json.loads(self.rfile.read(length).decode("utf-8"))
        if not isinstance(body, dict):
            raise ApiError(HTTPStatus.BAD_REQUEST, "Request body must be a JSON object.")
        return body

    def _cookie(self, name: str) -> str:
        cookie = SimpleCookie(self.headers.get("Cookie", ""))
        morsel = cookie.get(name)
        return morsel.value if morsel else ""

    def _access_token(self) -> str:
        authorization = self.headers.get("Authorization", "")
        if authorization.startswith("Bearer "):
            return authorization.removeprefix("Bearer ").strip()
        return self._cookie("access_token")

    def _require_session(self) -> Session:
        session = SESSIONS.get(self._access_token())
        if not session:
            raise ApiError(HTTPStatus.UNAUTHORIZED, "Authentication is required.")
        return session

    def _session_cookies(self, session: Session) -> list[str]:
        return [
            f"access_token={session.access_token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=1800",
            f"refresh_token={session.refresh_token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000",
        ]

    def _success(self, data: Any, cookies: list[str] | None = None) -> None:
        self._json_response(HTTPStatus.OK, {"status": HTTPStatus.OK, "data": data}, cookies)

    def _error(self, status: int, message: str) -> None:
        self._json_response(status, {"status": status, "message": message})

    def _json_response(
        self,
        status: int,
        payload: dict[str, Any],
        cookies: list[str] | None = None,
    ) -> None:
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self._send_cors_headers()
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        for cookie in cookies or []:
            self.send_header("Set-Cookie", cookie)
        self.end_headers()
        self.wfile.write(body)

    def _send_cors_headers(self) -> None:
        origin = self.headers.get("Origin", "")
        if origin and is_allowed_origin(origin):
            self.send_header("Access-Control-Allow-Origin", origin)
            self.send_header("Access-Control-Allow-Credentials", "true")
            self.send_header("Vary", "Origin")

    def log_message(self, format: str, *args: Any) -> None:
        if os.getenv("LOG_REQUESTS") == "1":
            super().log_message(format, *args)


def run() -> None:
    server = ThreadingHTTPServer(("0.0.0.0", PORT), AjudgeHandler)
    print(f"Ajudge backend listening on http://localhost:{PORT}")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


if __name__ == "__main__":
    run()
