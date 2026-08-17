from __future__ import annotations

import json
import threading
import unittest
import urllib.error
import urllib.parse
import urllib.request
from http.server import ThreadingHTTPServer
from unittest.mock import patch

import main as backend


class BackendTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.server = ThreadingHTTPServer(("127.0.0.1", 0), backend.AjudgeHandler)
        cls.thread = threading.Thread(target=cls.server.serve_forever, daemon=True)
        cls.thread.start()
        cls.origin = f"http://127.0.0.1:{cls.server.server_port}"

    @classmethod
    def tearDownClass(cls) -> None:
        cls.server.shutdown()
        cls.server.server_close()
        cls.thread.join()

    def request(
        self,
        path: str,
        *,
        method: str = "GET",
        payload: dict[str, str] | None = None,
        token: str = "",
    ) -> tuple[int, dict[str, object]]:
        headers = {"Content-Type": "application/json"}
        if token:
            headers["Authorization"] = f"Bearer {token}"
        request = urllib.request.Request(
            f"{self.origin}{path}",
            data=json.dumps(payload).encode("utf-8") if payload is not None else None,
            headers=headers,
            method=method,
        )
        try:
            with urllib.request.urlopen(request) as response:
                return response.status, json.loads(response.read())
        except urllib.error.HTTPError as error:
            try:
                return error.code, json.loads(error.read())
            finally:
                error.close()

    def test_google_login_url_matches_extension_contract(self) -> None:
        with (
            patch.object(backend, "GOOGLE_CLIENT_ID", "client-id"),
            patch.object(backend, "GOOGLE_CLIENT_SECRET", "client-secret"),
        ):
            login_url = backend.build_google_login_url(
                "https://extension-id.chromiumapp.org/login/callback"
            )

        query = urllib.parse.parse_qs(urllib.parse.urlparse(login_url).query)
        self.assertEqual(query["client_id"], ["client-id"])
        self.assertEqual(
            query["redirect_uri"],
            ["https://extension-id.chromiumapp.org/login/callback"],
        )
        self.assertEqual(query["scope"], ["openid email profile"])

    def test_ping_requires_and_accepts_access_token(self) -> None:
        status, _ = self.request("/auth/ping")
        self.assertEqual(status, 401)

        session = backend.SESSIONS.issue({"sub": "google-user"})
        status, body = self.request("/auth/ping", token=session.access_token)
        self.assertEqual(status, 200)
        self.assertEqual(body["data"], "퐁")

    def test_callback_returns_extension_tokens(self) -> None:
        with patch.object(
            backend,
            "exchange_google_code",
            return_value={"sub": "google-user", "email": "user@example.com"},
        ):
            status, body = self.request(
                "/auth/login/google/callback",
                method="POST",
                payload={
                    "code": "valid-code",
                    "redirect_uri": "https://extension-id.chromiumapp.org/login/callback",
                },
            )

        self.assertEqual(status, 200)
        data = body["data"]
        self.assertIsInstance(data, dict)
        self.assertIsInstance(data["accessToken"], str)
        self.assertIsInstance(data["refreshToken"], str)


if __name__ == "__main__":
    unittest.main()
