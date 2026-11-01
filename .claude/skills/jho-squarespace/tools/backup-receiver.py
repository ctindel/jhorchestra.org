# backup-receiver.py: local file receiver for the jho-squarespace backup.
#
# Usage: python3 backup-receiver.py <root-dir>
#   e.g. python3 .claude/skills/jho-squarespace/tools/backup-receiver.py <repo>/squarespace-backup
#
# Listens on 127.0.0.1:8765. The admin tab POSTs JSON:
#   {"path": "<relative path>", "text": "..."}   or   {"path": "...", "b64": "..."}
# and the file is written under <root-dir>. A path that resolves outside
# <root-dir> (for example "../x") gets HTTP 400 and nothing is written.
# CORS is open so the admin tab can POST, which means any page open in the
# browser can also POST here while this runs. Stop it (Ctrl-C) after the backup.
import base64, json, os, sys
from http.server import BaseHTTPRequestHandler, HTTPServer

ROOT = os.path.realpath(sys.argv[1])


class H(BaseHTTPRequestHandler):
    def _cors(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Headers", "*")
        self.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")
        self.send_header("Access-Control-Allow-Private-Network", "true")

    def do_OPTIONS(self):
        self.send_response(204)
        self._cors()
        self.end_headers()

    def do_POST(self):
        body = json.loads(self.rfile.read(int(self.headers["Content-Length"])))
        dest = os.path.realpath(os.path.join(ROOT, body["path"]))
        if not dest.startswith(ROOT + os.sep):
            self.send_response(400)
            self._cors()
            self.end_headers()
            return
        os.makedirs(os.path.dirname(dest), exist_ok=True)
        with open(dest, "wb") as f:
            f.write(base64.b64decode(body["b64"]) if body.get("b64") is not None else body["text"].encode())
        self.send_response(200)
        self._cors()
        self.end_headers()
        self.wfile.write(b"ok")

    def log_message(self, *a):
        pass


HTTPServer(("127.0.0.1", 8765), H).serve_forever()
