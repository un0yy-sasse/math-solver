"""Math Solver desktop app: shows the web app in a native window (WebView2)."""
import os
import sys

import webview


def app_dir() -> str:
    # PyInstaller unpacks bundled files to sys._MEIPASS
    if hasattr(sys, "_MEIPASS"):
        return os.path.join(sys._MEIPASS, "app")
    return os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


if __name__ == "__main__":
    index = os.path.join(app_dir(), "index.html")
    webview.create_window("Math Solver", index, width=1100, height=820, min_size=(420, 500))
    webview.start(http_server=True)
