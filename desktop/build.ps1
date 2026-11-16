# Builds dist\MathSolver-English.exe and dist\MatheLoeser-Deutsch.exe
# Run from the repo root: powershell -ExecutionPolicy Bypass -File desktop\build.ps1
$ErrorActionPreference = "Stop"
if (-not (Test-Path .venv)) { python -m venv .venv }
.\.venv\Scripts\python -m pip install --quiet -r desktop\requirements.txt

$builds = @(
  @{ Lang = "en"; Name = "MathSolver-English" },
  @{ Lang = "de"; Name = "MatheLoeser-Deutsch" }
)
foreach ($b in $builds) {
  New-Item -ItemType Directory -Force build\lang | Out-Null
  Set-Content -Path build\lang\lang.txt -Value $b.Lang -Encoding ascii -NoNewline
  .\.venv\Scripts\pyinstaller --noconfirm --onefile --windowed --name $b.Name `
    --add-data "index.html;app" --add-data "style.css;app" --add-data "app.js;app" `
    --add-data "de;app\de" --add-data "vendor;app\vendor" --add-data "build\lang\lang.txt;app" `
    desktop\main.py
  if ($LASTEXITCODE -ne 0) { throw "Build failed: $($b.Name)" }
}
Write-Host "Done: dist\MathSolver-English.exe, dist\MatheLoeser-Deutsch.exe"
