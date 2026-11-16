# Mathe-Löser

Ein Taschenrechner für (fast) alle Mathe-Themen – mit **Lösungsweg**. Läuft komplett im Browser, keine Installation nötig.

## Funktionen

| Bereich | Was er kann |
|---|---|
| **Rechner** | Wissenschaftlicher Rechner (Grad/Bogenmaß, `sin`, `cos`, `tan`, `sqrt`, `lg`, `ln`, `^`, `!`, `%`, `ans`), Verlauf |
| **Brüche** | `+ − · :` mit Schritten (Hauptnenner, Erweitern, Kehrwert, Kürzen), gemischte Zahlen (`1 2/3`), Dezimal & Prozent, beliebige Bruch-Terme exakt |
| **Gleichungen** | Linear, quadratisch (Diskriminante + Mitternachtsformel, auch komplex), kubisch, Bruchgleichungen, beliebige Gleichungen numerisch (`sin(x) = 0.5`, `2^x = 32`) |
| **Gleichungssysteme** | Lineare Systeme mit beliebig vielen Variablen (Matrix, Determinante, Lösung) |
| **Terme & Analysis** | Vereinfachen, Ausmultiplizieren, 1. und 2. Ableitung, bestimmtes Integral, Funktionswerte |
| **Funktionsplotter** | Mehrere Funktionen gleichzeitig zeichnen (mit `;` trennen) |
| **Geometrie** | Quadrat, Rechteck, Dreiecke (Heron, Pythagoras, Winkel), Kreis, Kreisausschnitt, Trapez, Raute, Würfel, Quader, Zylinder, Kegel, Kugel, Pyramide |
| **Prozent & Dreisatz** | Grundwert/Prozentsatz/Prozentwert, proportionaler und antiproportionaler Dreisatz |
| **Statistik** | Mittelwert, Median, Modus, Quartile, Varianz, Standardabweichung u. v. m. |
| **Teiler & Primzahlen** | ggT, kgV, Primfaktorzerlegung, Primzahltest, alle Teiler |
| **Einheiten** | Umrechnen, z. B. `120 km/h in m/s`, `25 °C in °F` |

## Starten

Einfach `index.html` im Browser öffnen. Oder mit lokalem Server:

```bash
python -m http.server 8765
```

Dann <http://localhost:8765> öffnen.

## Aufbau

- `index.html` – Oberfläche
- `style.css` – Design (heller und dunkler Modus)
- `app.js` – gesamte Rechenlogik
- Rechen-Bibliothek: [math.js](https://mathjs.org) (per CDN geladen, Internet nötig)

## Eingabe-Tipps

- Malzeichen kann weggelassen werden: `2x`, `3(x+1)`
- Dezimalkomma geht auch: `2,5`
- Potenz: `x^2`, Wurzel: `sqrt(x)`, Pi: `pi`
