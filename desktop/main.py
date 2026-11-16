"""Math Solver / Mathe-Löser desktop app: shows the web app in a native window (WebView2).

The start language comes from a bundled lang.txt ("en" or "de"), written by build.ps1.
"""
import functools
import os
import sys
import threading
import time
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

import webview


class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self, *args):  # windowed exe has no console
        pass

TITLES = {"en": "Math Solver", "de": "Mathe-Löser"}
PAGES = {"en": "index.html", "de": os.path.join("de", "index.html")}


def app_dir() -> str:
    # PyInstaller unpacks bundled files to sys._MEIPASS
    if hasattr(sys, "_MEIPASS"):
        return os.path.join(sys._MEIPASS, "app")
    return os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def language(root: str) -> str:
    lang = os.environ.get("MATHSOLVER_LANG", "")
    if not lang:
        try:
            with open(os.path.join(root, "lang.txt"), encoding="utf-8") as f:
                lang = f.read().strip()
        except OSError:
            lang = "en"
    return lang if lang in PAGES else "en"


def self_test(window: webview.Window) -> None:
    """Set MATHSOLVER_SELFTEST=<file> to write page status to a file and quit (used for build checks)."""
    out = os.environ["MATHSOLVER_SELFTEST"]
    window.events.loaded.wait(30)
    time.sleep(1)
    res = window.evaluate_js(
        "document.querySelector('#frac-in').value='3/4 + 5/6';document.querySelector('#frac-go').click();"
        "document.title + ' | math=' + typeof math + ' | css=' + getComputedStyle(document.querySelector('.tab')).borderRadius + ' | ' + document.querySelector('#frac-out .result').innerText.replace(/\\n/g,' ')"
    )
    with open(out, "w", encoding="utf-8") as f:
        f.write(str(res))
    window.destroy()


if __name__ == "__main__":
    root = app_dir()
    lang = language(root)
    # Serve the whole app folder locally so de/index.html can reach ../style.css and ../vendor
    handler = functools.partial(QuietHandler, directory=root)
    server = ThreadingHTTPServer(("127.0.0.1", 0), handler)
    threading.Thread(target=server.serve_forever, daemon=True).start()
    url = f"http://127.0.0.1:{server.server_address[1]}/{PAGES[lang].replace(os.sep, '/')}"
    window = webview.create_window(TITLES[lang], url, width=1100, height=820, min_size=(420, 500))
    if os.environ.get("MATHSOLVER_SELFTEST"):
        webview.start(self_test, window)
    else:
        webview.start()
