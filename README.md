# Math Solver

A calculator for (almost) every math topic – with **step-by-step solutions**. Runs entirely in the browser, no installation needed.

Available in **English** (`index.html`) and **German / Deutsch** (`de/index.html`) – switch with the button at the top right.

> 🇩🇪 **Deutsch:** Ein Taschenrechner für fast alle Mathe-Themen mit Lösungsweg. Die deutsche Version liegt in `de/index.html`, als Programm: `MatheLoeser-Deutsch.exe` unter [Releases](../../releases).

## Features

| Area | What it does |
|---|---|
| **Calculator** | Scientific calculator (degrees/radians, `sin`, `cos`, `tan`, `sqrt`, `log`, `ln`, `^`, `!`, `%`, `ans`), history |
| **Fractions** | `+ − × ÷` with steps (common denominator, expanding, reciprocal, simplifying), mixed numbers (`1 2/3`), decimal & percent, any fraction expression evaluated exactly |
| **Equations** | Linear, quadratic (discriminant + quadratic formula, complex roots too), cubic, rational equations, any other equation numerically (`sin(x) = 0.5`, `2^x = 32`) |
| **Systems of equations** | Linear systems with any number of variables (matrix, determinant, solution) |
| **Algebra & Calculus** | Simplify, expand, 1st and 2nd derivative, definite integral, function values |
| **Graphing** | Plot several functions at once (separate with `;`) |
| **Geometry** | Square, rectangle, triangles (Heron, Pythagoras, angles), circle, sector, trapezoid, rhombus, cube, cuboid, cylinder, cone, sphere, pyramid |
| **Percent & Proportions** | Base / rate / part, direct and inverse rule of three |
| **Statistics** | Mean, median, mode, quartiles, variance, standard deviation and more |
| **Factors & Primes** | GCD, LCM, prime factorization, primality test, all divisors |
| **Units** | Conversions, e.g. `120 km/h to m/s`, `25 degC to degF` |

## Getting started

Just open `index.html` in your browser, or use a local server:

```bash
python -m http.server 8765
```

Then open <http://localhost:8765>.

## Structure

- `index.html` – user interface
- `style.css` – styling (light and dark mode)
- `app.js` – all the math logic
- `de/` – German version (`index.html`, `app.js`)
- `vendor/math.min.js` – math library [math.js](https://mathjs.org) 12.4.2 (Apache-2.0), bundled so it works offline
- `desktop/` – Windows desktop app (pywebview + PyInstaller)

## Input tips

- You can leave out the multiplication sign: `2x`, `3(x+1)`
- Powers: `x^2`, square root: `sqrt(x)`, pi: `pi`
- In the calculator, `log` is base 10 and `ln` is the natural logarithm

## Desktop app (Windows .exe)

Download from the [Releases](../../releases) page and double-click it:

| File | Language |
|---|---|
| `MathSolver-English.exe` | 🇬🇧 English |
| `MatheLoeser-Deutsch.exe` | 🇩🇪 Deutsch (German) |

Both contain both languages and can switch at the top right; the name says which one opens first. Works offline (math.js is bundled). Needs Microsoft Edge WebView2, which is built into Windows 10/11.

Build it yourself:

```bash
powershell -ExecutionPolicy Bypass -File desktop\build.ps1
```

The exes end up in `dist\`.
