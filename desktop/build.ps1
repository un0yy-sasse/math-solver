# Builds dist\MathSolver.exe (run from the repo root: powershell -File desktop\build.ps1)
$ErrorActionPreference = "Stop"
python -m venv .venv
.\.venv\Scripts\python -m pip install --quiet -r desktop\requirements.txt
.\.venv\Scripts\pyinstaller --noconfirm --onefile --windowed --name MathSolver `
  --add-data "index.html;app" --add-data "style.css;app" --add-data "app.js;app" --add-data "vendor;app\vendor" `
  desktop\main.py
Write-Host "Done: dist\MathSolver.exe"
