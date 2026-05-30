"""ローカル開発用 HTTP サーバー（stdlib のみ）"""

from __future__ import annotations

import json
import os
import sys
from http.server import BaseHTTPRequestHandler, HTTPServer
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parent
REPO_ROOT = BACKEND_DIR.parent.parent

if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))


def load_dotenv(path: Path) -> None:
    if not path.is_file():
        return
    for line in path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, value = line.partition("=")
        key = key.strip()
        value = value.strip().strip('"').strip("'")
        if key and key not in os.environ:
            os.environ[key] = value


load_dotenv(REPO_ROOT / ".env")

from handler import CORS_HEADERS, handle_http  # noqa: E402


class DeliverHandler(BaseHTTPRequestHandler):
    def log_message(self, fmt: str, *args) -> None:
        print(f"[local_server] {self.address_string()} - {fmt % args}")

    def do_OPTIONS(self) -> None:
        self._respond(*handle_http("OPTIONS", None))

    def do_POST(self) -> None:
        length = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(length) if length else b""
        self._respond(*handle_http("POST", body))

    def _respond(self, status: int, payload: dict) -> None:
        if status == 204:
            self.send_response(204)
            for key, value in CORS_HEADERS.items():
                self.send_header(key, value)
            self.end_headers()
            return

        body_bytes = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        for key, value in CORS_HEADERS.items():
            self.send_header(key, value)
        self.send_header("Content-Length", str(len(body_bytes)))
        self.end_headers()
        self.wfile.write(body_bytes)


def main() -> None:
    port = int(os.environ.get("LOCAL_API_PORT", "8787"))
    server = HTTPServer(("127.0.0.1", port), DeliverHandler)
    print(f"Local deliver API: http://127.0.0.1:{port}/")
    print("Press Ctrl+C to stop.")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nStopped.")
        server.server_close()


if __name__ == "__main__":
    main()
