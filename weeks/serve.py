#!/usr/bin/env python3
"""Serve the full course tree without stale browser assets; standard library only."""
from argparse import ArgumentParser
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

ROOT = Path(__file__).resolve().parent


class CourseHandler(SimpleHTTPRequestHandler):
    def send_head(self):
        # Source edits may happen within the same Last-Modified second. Always
        # return the current file instead of accepting a stale conditional hit.
        for name in ("If-Modified-Since", "If-None-Match"):
            if name in self.headers:
                del self.headers[name]
        return super().send_head()

    def end_headers(self):
        self.send_header("Cache-Control", "no-store, max-age=0")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()


def main():
    parser = ArgumentParser(description="启动图形学课程，自动提供整个 weeks/ 目录并禁用旧资源缓存。")
    parser.add_argument("--port", type=int, default=8003)
    parser.add_argument("--bind", default="127.0.0.1")
    args = parser.parse_args()
    handler = partial(CourseHandler, directory=str(ROOT))
    with ThreadingHTTPServer((args.bind, args.port), handler) as server:
        print(f"图形学课程：http://{args.bind}:{args.port}/  （目录：{ROOT}；禁用旧资源缓存）", flush=True)
        try:
            server.serve_forever()
        except KeyboardInterrupt:
            pass


if __name__ == "__main__":
    main()
