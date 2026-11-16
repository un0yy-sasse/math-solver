/* Mathe-Löser – alle Rechenarten mit Lösungsweg. Benötigt math.js. */
(() => {
'use strict';

const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];
const MF = math.create(); // eigene Instanz für exakte Bruch-Arithmetik
MF.config({ number: 'Fraction' });

// ---------- Hilfsfunktionen ----------
function gcd(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a; }
function lcm(a, b) { return a && b ? Math.abs(a * b) / gcd(a, b) : 0; }
function reduce(n, d) {
  const g = gcd(n, d) || 1;
  let r = [n / g, d / g];
  if (r[1] < 0) r = [-r[0], -r[1]];
  return r;
}
function esc(s) { return String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
function fmt(x) {
  if (typeof x === 'number') {
    if (Math.abs(x) < 1e-12) return '0';
    return math.format(x, { precision: 12 }).replace('.', ',');
  }
  return esc(math.format(x, { precision: 12 }));
}
/** Bruch als HTML (gestapelt). */
function fr(n, d = 1) {
  [n, d] = d < 0 ? [-n, -d] : [n, d];
  if (d === 1) return String(n).replace('-', '−');
  return (n < 0 ? '−' : '') + `<span class="frac"><span>${Math.abs(n)}</span><span>${d}</span></span>`;
}
/** Zahl hübsch: als Bruch, wenn sie (fast) rational ist. */
function nice(x, short = false) {
  if (typeof x !== 'number' || !isFinite(x)) return fmt(x);
  if (Number.isInteger(Math.round(x * 1e10) / 1e10) && Math.abs(x - Math.round(x)) < 1e-10) return fmt(Math.round(x));
  try {
    const f = math.fraction(x);
    if (f.d <= 1000 && Math.abs(f.s * f.n / f.d - x) < 1e-10) return short ? fr(f.s * f.n, f.d) : `${fr(f.s * f.n, f.d)} ≈ ${fmt(x)}`;
  } catch (_) { /* ignorieren */ }
  return fmt(x);
}
function normalize(s) {
  return s
    .replace(/[·×]/g, '*').replace(/÷/g, '/').replace(/[−–]/g, '-')
    .replace(/²/g, '^2').replace(/³/g, '^3').replace(/√/g, 'sqrt').replace(/π/g, 'pi')
    .replace(/(\d),(\d)/g, '$1.$2');
}
const steps = (items) => `<ol class="steps">${items.map((s) => `<li>${s}</li>`).join('')}</ol>`;
const result = (main, sub = '') => `<div class="result">${main}${sub ? `<small>${sub}</small>` : ''}</div>`;
const error = (msg) => `<div class="error">${esc(msg)}</div>`;
const table = (rows) => `<table>${rows.map(([k, v]) => `<tr><td>${k}</td><td>${v}</td></tr>`).join('')}</table>`;
function num(id) {
  const v = $(id).value.trim();
  if (v === '') return NaN;
  return Number(math.evaluate(normalize(v)));
}
function onEnter(inputId, fn) {
  $(inputId).addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey && e.target.tagName !== 'TEXTAREA') fn(); });
}
function guard(outId, fn) {
  return () => {
    try { fn(); } catch (e) { $(outId).innerHTML = error('Fehler: ' + (e.message || e)); }
  };
}

// ---------- Tabs & Beispiel-Chips ----------
$$('#tabs button').forEach((b) => b.addEventListener('click', () => {
  $$('#tabs button').forEach((x) => x.classList.toggle('active', x === b));
  $$('.tab').forEach((t) => t.classList.toggle('active', t.id === b.dataset.tab));
  if (b.dataset.tab === 'plotter') plot();
}));
$$('.chips').forEach((c) => c.addEventListener('click', (e) => {
  if (e.target.tagName !== 'SPAN') return;
  const id = c.dataset.for;
  $('#' + id).value = c.hasAttribute('data-multi') ? e.target.textContent.split('|').join('\n') : e.target.textContent;
  const go = document.getElementById(id.replace('-in', '-go')) || $('[data-term="simplify"]');
  go.click();
}));

// ---------- Wissenschaftlicher Rechner ----------
const calcScope = { ans: 0 };
function trigScope() {
  const deg = $('input[name="angle"]:checked').value === 'deg';
  const k = deg ? Math.PI / 180 : 1;
  return {
    sin: (x) => Math.sin(x * k), cos: (x) => Math.cos(x * k), tan: (x) => Math.tan(x * k),
    asin: (x) => Math.asin(x) / k, acos: (x) => Math.acos(x) / k, atan: (x) => Math.atan(x) / k,
    ln: (x) => Math.log(x), lg: (x) => Math.log10(x),
    log: (x, b) => (b === undefined ? Math.log10(x) : Math.log(x) / Math.log(b)),
  };
}
const calc = guard('#calc-out', () => {
  const raw = $('#calc-in').value.trim();
  if (!raw) return;
  const expr = normalize(raw).replace(/(\d+(?:\.\d+)?)%/g, '($1/100)');
  const scope = Object.assign({}, calcScope, trigScope());
  const r = math.evaluate(expr, scope);
  calcScope.ans = r;
  const shown = typeof r === 'number' ? nice(r) : fmt(r);
  $('#calc-out').innerHTML = result(`${esc(raw)} = ${shown}`);
  const li = document.createElement('li');
  li.innerHTML = `${esc(raw)} = ${typeof r === 'number' ? fmt(r) : fmt(r)}`;
  li.onclick = () => { $('#calc-in').value = raw; };
  $('#calc-hist').prepend(li);
});
$('#calc-go').onclick = calc;
onEnter('#calc-in', calc);
const keys = ['7', '8', '9', '/', '(', ')', '4', '5', '6', '*', '^', 'sqrt(', '1', '2', '3', '-', 'sin(', 'cos(',
  '0', ',', 'pi', '+', 'tan(', 'lg(', 'C', '⌫', 'ans', '!', 'ln(', '='];
keys.forEach((k) => {
  const b = document.createElement('button');
  b.textContent = k === '*' ? '×' : k === '/' ? '÷' : k === 'pi' ? 'π' : k.replace('(', '');
  if (k === '=') b.className = 'primary';
  b.onclick = () => {
    const inp = $('#calc-in');
    if (k === '=') return calc();
    if (k === 'C') inp.value = '';
    else if (k === '⌫') inp.value = inp.value.slice(0, -1);
    else inp.value += k;
    inp.focus();
  };
  $('#keypad').appendChild(b);
});

// ---------- Brüche ----------
const TOKEN = String.raw`-?\d+(?:\s+\d+\s*\/\s*\d+|\s*\/\s*\d+)?`;
function parseFracToken(t, log) {
  t = t.trim();
  let m = t.match(/^(-?)(\d+)\s+(\d+)\s*\/\s*(\d+)$/);
  if (m) {
    const sign = m[1] ? -1 : 1, w = +m[2], n = +m[3], d = +m[4];
    const z = sign * (w * d + n);
    log.push(`Gemischte Zahl umwandeln: ${m[1] ? '−' : ''}${w} ${fr(n, d)} = ${fr(z, d)} &nbsp;(${w} · ${d} + ${n} = ${Math.abs(z)})`);
    return [z, d];
  }
  m = t.match(/^(-?\d+)\s*\/\s*(\d+)$/);
  if (m) return [+m[1], +m[2]];
  return [+t, 1];
}
function fracResult(n, d) {
  if (d === 0) throw new Error('Division durch 0 ist nicht definiert.');
  const [rn, rd] = reduce(n, d);
  let mixed = '';
  if (rd !== 1 && Math.abs(rn) > rd) {
    const w = Math.trunc(rn / rd), rest = Math.abs(rn % rd);
    mixed = `Gemischte Zahl: ${w < 0 ? '−' : ''}${Math.abs(w)} ${fr(rest, rd)}`;
  }
  const dec = rn / rd;
  return result(`= ${fr(rn, rd)}`, [mixed, `Dezimal: ${fmt(dec)}`, `Prozent: ${fmt(dec * 100)} %`].filter(Boolean).join(' · '));
}
function kuerzenStep(n, d, log) {
  const g = gcd(n, d);
  if (g > 1) log.push(`Kürzen mit ggT(${Math.abs(n)}, ${Math.abs(d)}) = ${g}: ${fr(n, d)} = ${fr(n / g, d / g)}`);
  else if (d !== 1) log.push(`${fr(n, d)} ist bereits vollständig gekürzt.`);
}
const solveFrac = guard('#frac-out', () => {
  const raw = $('#frac-in').value.trim();
  if (!raw) return;
  const log = [];
  const bin = raw.match(new RegExp(`^\\s*(${TOKEN})\\s*([+\\-*·×:÷])\\s*(${TOKEN})\\s*$`));
  const single = raw.match(new RegExp(`^\\s*(${TOKEN})\\s*$`));
  if (single) {
    const [n, d] = parseFracToken(single[1], log);
    if (d === 0) throw new Error('Der Nenner darf nicht 0 sein.');
    kuerzenStep(n, d, log);
    $('#frac-out').innerHTML = steps(log) + fracResult(n, d);
    return;
  }
  if (bin) {
    let [a, b] = parseFracToken(bin[1], log);
    let [c, d] = parseFracToken(bin[3], log);
    const op = bin[2];
    if (b === 0 || d === 0) throw new Error('Ein Nenner darf nicht 0 sein.');
    let n, den;
    if (op === '+' || op === '-') {
      const s = op === '+' ? 1 : -1, sym = op === '+' ? '+' : '−';
      if (b === d) {
        log.push(`Gleiche Nenner – nur die Zähler ${op === '+' ? 'addieren' : 'subtrahieren'}: ${fr(a, b)} ${sym} ${fr(c, d)} = ${fr(a + s * c, b)}`);
        n = a + s * c; den = b;
      } else {
        const hn = lcm(b, d);
        log.push(`Hauptnenner bestimmen: kgV(${b}, ${d}) = ${hn}`);
        const ea = a * (hn / b), ec = c * (hn / d);
        log.push(`Erweitern: ${fr(a, b)} = ${fr(ea, hn)} (mit ${hn / b}) &nbsp;und&nbsp; ${fr(c, d)} = ${fr(ec, hn)} (mit ${hn / d})`);
        n = ea + s * ec; den = hn;
        log.push(`Zähler ${op === '+' ? 'addieren' : 'subtrahieren'}: ${fr(ea, hn)} ${sym} ${fr(ec, hn)} = ${fr(n, den)}`);
      }
    } else if (op === ':' || op === '÷') {
      if (c === 0) throw new Error('Division durch 0 ist nicht definiert.');
      log.push(`Durch einen Bruch teilen = mit dem Kehrwert multiplizieren: ${fr(a, b)} : ${fr(c, d)} = ${fr(a, b)} · ${fr(d, c)}`);
      [c, d] = [d, c];
      n = a * c; den = b * d;
      log.push(`Zähler mal Zähler, Nenner mal Nenner: ${fr(a * c, b * d)}`);
    } else {
      n = a * c; den = b * d;
      log.push(`Zähler mal Zähler, Nenner mal Nenner: ${fr(a, b)} · ${fr(c, d)} = ${fr(n, den)}`);
    }
    kuerzenStep(n, den, log);
    $('#frac-out').innerHTML = steps(log) + fracResult(n, den);
    return;
  }
  // Allgemeiner Ausdruck: exakt mit Brüchen auswerten
  const expr = normalize(raw).replace(/:/g, '/').replace(/(\d+)\s+(\d+)\s*\/\s*(\d+)/g, '($1+$2/$3)');
  const r = MF.evaluate(expr);
  if (r && r.d !== undefined) {
    $('#frac-out').innerHTML = steps(['Ausdruck exakt ausgewertet (Punkt- vor Strichrechnung, Klammern zuerst).']) +
      fracResult(r.s * r.n, r.d);
  } else {
    $('#frac-out').innerHTML = result('= ' + fmt(r));
  }
});
$('#frac-go').onclick = solveFrac;
onEnter('#frac-in', solveFrac);

// ---------- Gleichungen ----------
function freeSymbols(node) {
  const names = new Set();
  node.traverse((n, path, parent) => {
    if (n.isSymbolNode && !(parent && parent.isFunctionNode && parent.fn === n) && math[n.name] === undefined) names.add(n.name);
  });
  return [...names];
}
function realOf(y) {
  if (typeof y === 'number') return y;
  if (y && typeof y.re === 'number') return Math.abs(y.im) < 1e-12 ? y.re : NaN;
  return NaN;
}
function numericRoots(expr, v, lo = -100, hi = 100, N = 40000) {
  const c = math.compile(expr);
  const g = (x) => { try { return realOf(c.evaluate({ [v]: x })); } catch (_) { return NaN; } };
  const roots = [];
  const h = (hi - lo) / N;
  let a = lo, fa = g(a);
  for (let i = 0; i < N; i++) {
    const b = a + h, fb = g(b);
    if (fa === 0) roots.push(a);
    else if (isFinite(fa) && isFinite(fb) && fa * fb < 0) {
      let l = a, r = b, fl = fa;
      for (let k = 0; k < 80; k++) {
        const m = (l + r) / 2, fm = g(m);
        if (fl * fm <= 0) r = m; else { l = m; fl = fm; }
      }
      const x = (l + r) / 2;
      if (Math.abs(g(x)) < 1e-6) roots.push(x); // Polstellen aussortieren
    }
    a = b; fa = fb;
  }
  const out = [];
  roots.forEach((x) => { if (!out.some((y) => Math.abs(y - x) < 1e-6)) out.push(Math.abs(x) < 1e-12 ? 0 : x); });
  return out;
}
function polyStr(coef, v) {
  const parts = [];
  for (let i = coef.length - 1; i >= 0; i--) {
    const c = coef[i];
    if (Math.abs(c) < 1e-14) continue;
    const abs = Math.abs(c);
    const coefStr = (abs === 1 && i > 0) ? '' : fmt(abs);
    const pow = i === 0 ? '' : i === 1 ? v : `${v}<sup>${i}</sup>`;
    parts.push((c < 0 ? ' − ' : (parts.length ? ' + ' : '')) + coefStr + pow);
  }
  return (parts.join('') || '0').replace(/^ − /, '−');
}
const solveEq = guard('#eq-out', () => {
  const raw = $('#eq-in').value.trim();
  if (!raw) return;
  const s = normalize(raw);
  const sides = s.split('=');
  if (sides.length !== 2) throw new Error('Bitte genau ein Gleichheitszeichen verwenden, z. B. 2x + 3 = 7');
  const expr = `(${sides[0]}) - (${sides[1]})`;
  const vars = freeSymbols(math.parse(expr));
  const log = [];
  if (vars.length === 0) {
    const ok = Math.abs(realOf(math.evaluate(expr))) < 1e-10;
    $('#eq-out').innerHTML = result(ok ? 'Die Aussage ist wahr.' : 'Die Aussage ist falsch.');
    return;
  }
  if (vars.length > 1) throw new Error(`Mehrere Variablen (${vars.join(', ')}) – bitte den Tab „Gleichungssysteme“ verwenden.`);
  const v = vars[0];

  let poly = null;
  try {
    const r = math.rationalize(expr, {}, true);
    if (r.coefficients && r.coefficients.length) poly = r;
  } catch (_) { /* keine Polynomgleichung */ }

  if (poly) {
    const coef = poly.coefficients.map(Number);
    while (coef.length > 1 && Math.abs(coef[coef.length - 1]) < 1e-14) coef.pop();
    const deg = coef.length - 1;
    const denOk = (x) => !poly.denominator || Math.abs(realOf(poly.denominator.evaluate({ [v]: x }))) > 1e-12;
    log.push(`Alles auf eine Seite bringen${poly.denominator ? ' und mit dem Nenner multiplizieren' : ''}: ${polyStr(coef, v)} = 0`);
    let sols = [];
    if (deg === 0) {
      $('#eq-out').innerHTML = steps(log) + result(Math.abs(coef[0]) < 1e-12 ? `Jedes ${v} ist eine Lösung (𝕃 = ℝ).` : 'Keine Lösung (𝕃 = ∅).');
      return;
    }
    if (deg === 1) {
      const [b, a] = coef;
      const q = (x) => (x < 0 ? `(${nice(x, true)})` : nice(x, true));
      log.push(`Konstante auf die andere Seite bringen: ${nice(a, true)} · ${v} = ${nice(-b, true)}`);
      log.push(`Durch ${q(a)} teilen: ${v} = ${nice(-b, true)} : ${q(a)}`);
      sols = [-b / a];
    } else if (deg === 2) {
      const [c, b, a] = coef;
      log.push(`Quadratische Gleichung mit a = ${fmt(a)}, b = ${fmt(b)}, c = ${fmt(c)}`);
      const D = b * b - 4 * a * c;
      const p = (x) => (x < 0 ? `(${fmt(x)})` : fmt(x));
      log.push(`Diskriminante: D = b² − 4ac = ${p(b)}² − 4 · ${p(a)} · ${p(c)} = ${fmt(D)}`);
      log.push(`Mitternachtsformel: ${v}<sub>1,2</sub> = (−b ± √D) / (2a) = (${fmt(-b)} ± √${p(D)}) / ${p(2 * a)}`);
      if (D > 1e-12) {
        log.push('D > 0 → zwei reelle Lösungen');
        sols = [(-b + Math.sqrt(D)) / (2 * a), (-b - Math.sqrt(D)) / (2 * a)];
      } else if (Math.abs(D) <= 1e-12) {
        log.push('D = 0 → genau eine (doppelte) Lösung');
        sols = [-b / (2 * a)];
      } else {
        log.push('D < 0 → keine reelle Lösung, aber zwei komplexe Lösungen');
        const re = -b / (2 * a), im = Math.sqrt(-D) / (2 * Math.abs(a));
        $('#eq-out').innerHTML = steps(log) + result(`${v}<sub>1,2</sub> = ${fmt(re)} ± ${fmt(im)}i`, 'Keine Lösung in ℝ');
        return;
      }
    } else if (deg === 3) {
      log.push('Kubische Gleichung – Lösung mit der Cardanischen Formel');
      const rs = math.polynomialRoot(coef[0], coef[1], coef[2], coef[3]);
      sols = rs.map(realOf).filter((x) => !isNaN(x));
      const cx = rs.filter((x) => isNaN(realOf(x)));
      if (cx.length) log.push(`Komplexe Lösungen: ${cx.map((z) => fmt(z)).join(', ')}`);
    } else {
      log.push(`Polynom vom Grad ${deg} – Nullstellen numerisch gesucht (Intervall −100 … 100)`);
      sols = numericRoots(expr, v);
    }
    sols = sols.filter(denOk);
    sols = sols.filter((x, i) => sols.findIndex((y) => Math.abs(x - y) < 1e-9) === i).sort((x, y) => x - y);
    if (poly.denominator) log.push('Werte, für die der Nenner 0 wird, sind ausgeschlossen.');
    $('#eq-out').innerHTML = steps(log) + (sols.length
      ? result(sols.map((x, i) => `${v}${sols.length > 1 ? `<sub>${i + 1}</sub>` : ''} = ${nice(x)}`).join('<br>'))
      : result('Keine reelle Lösung.'));
    return;
  }

  log.push(`Keine Polynomgleichung – Nullstellen von f(${v}) = ${esc(sides[0].trim())} − (${esc(sides[1].trim())}) numerisch gesucht (Intervall −10 … 10, Bisektionsverfahren)`);
  const sols = numericRoots(expr, v, -10, 10, 20000);
  const shown = sols.slice(0, 20);
  $('#eq-out').innerHTML = steps(log) + (shown.length
    ? result(shown.map((x, i) => `${v}<sub>${i + 1}</sub> ≈ ${fmt(x)}`).join('<br>'), sols.length > 20 ? `… und ${sols.length - 20} weitere (periodisch?)` : '')
    : result('Keine Lösung im Bereich −10 … 10 gefunden.'));
});
$('#eq-go').onclick = solveEq;
onEnter('#eq-in', solveEq);

// ---------- Lineare Gleichungssysteme ----------
const solveLgs = guard('#lgs-out', () => {
  const lines = $('#lgs-in').value.split('\n').map((l) => l.trim()).filter(Boolean);
  if (!lines.length) return;
  const exprs = lines.map((l) => {
    const p = normalize(l).split('=');
    if (p.length !== 2) throw new Error(`„${l}“ braucht genau ein Gleichheitszeichen.`);
    return `(${p[0]}) - (${p[1]})`;
  });
  const vars = [...new Set(exprs.flatMap((e) => freeSymbols(math.parse(e))))].sort();
  const n = vars.length;
  if (lines.length !== n) throw new Error(`${lines.length} Gleichungen, aber ${n} Variablen (${vars.join(', ')}). Es werden gleich viele benötigt.`);
  const A = [], b = [];
  exprs.forEach((e) => {
    const c = math.compile(e);
    const at = (vals) => Number(c.evaluate(Object.fromEntries(vars.map((v, i) => [v, vals[i]]))));
    const c0 = at(vars.map(() => 0));
    const row = vars.map((_, j) => at(vars.map((__, k) => (k === j ? 1 : 0))) - c0);
    const test = vars.map(() => Math.random() * 10 - 5);
    if (Math.abs(at(test) - (c0 + row.reduce((s, a, j) => s + a * test[j], 0))) > 1e-8) throw new Error('Das System ist nicht linear.');
    A.push(row); b.push(-c0);
  });
  const det = math.det(A);
  const log = [
    `Koeffizientenmatrix A und rechte Seite b (Variablen: ${vars.join(', ')}):`,
    `<table>${A.map((r, i) => `<tr>${r.map((x) => `<td>${fmt(x)}</td>`).join('')}<td>| ${fmt(b[i])}</td></tr>`).join('')}</table>`,
    `Determinante: det(A) = ${fmt(det)}`,
  ];
  if (Math.abs(det) < 1e-12) {
    $('#lgs-out').innerHTML = steps(log) + result('det(A) = 0 → keine eindeutige Lösung', 'Das System hat entweder keine oder unendlich viele Lösungen.');
    return;
  }
  log.push('det(A) ≠ 0 → genau eine Lösung (Gauß-Verfahren / LU-Zerlegung)');
  const x = math.lusolve(A, b).map((r) => r[0]);
  $('#lgs-out').innerHTML = steps(log) + result(vars.map((v, i) => `${v} = ${nice(x[i])}`).join('<br>'));
});
$('#lgs-go').onclick = solveLgs;

// ---------- Terme & Analysis ----------
function simpson(f, a, b, n = 2000) {
  const h = (b - a) / n;
  let s = f(a) + f(b);
  for (let i = 1; i < n; i++) s += f(a + i * h) * (i % 2 ? 4 : 2);
  return (s * h) / 3;
}
const pretty = (node) => esc(node.toString({ implicit: 'hide', parenthesis: 'auto' }).replace(/ \^ /g, '^').replace(/ \* /g, ' · '));
$$('[data-term]').forEach((btn) => btn.addEventListener('click', guard('#term-out', () => {
  const raw = $('#term-in').value.trim();
  if (!raw) return;
  const s = normalize(raw);
  const v = $('#term-var').value.trim() || 'x';
  const out = $('#term-out');
  switch (btn.dataset.term) {
    case 'simplify':
      out.innerHTML = result(`${esc(raw)} = ${pretty(math.simplify(s))}`);
      break;
    case 'expand': {
      let r;
      try { r = math.rationalize(s); } catch (_) { r = math.simplify(s); }
      out.innerHTML = result(`${esc(raw)} = ${pretty(r)}`);
      break;
    }
    case 'derive': {
      const d1 = math.derivative(s, v), d2 = math.derivative(d1, v);
      out.innerHTML = steps([`f(${v}) = ${esc(raw)}`, 'Ableitungsregeln: Summen-, Faktor-, Potenz-, Produkt- und Kettenregel']) +
        result(`f′(${v}) = ${pretty(d1)}`, `f″(${v}) = ${pretty(d2)}`);
      break;
    }
    case 'integral': {
      const a = num('#term-a'), b = num('#term-b');
      const c = math.compile(s);
      const val = simpson((x) => realOf(c.evaluate({ [v]: x })), a, b);
      out.innerHTML = steps([`∫ von ${fmt(a)} bis ${fmt(b)} über ${esc(raw)} d${v}`, 'Numerisch mit der Simpsonregel (2000 Teilintervalle)']) +
        result(`≈ ${isFinite(val) ? fmt(Math.round(val * 1e9) / 1e9) : 'nicht definiert'}`);
      break;
    }
    case 'value': {
      const a = num('#term-a');
      out.innerHTML = result(`f(${fmt(a)}) = ${fmt(math.evaluate(s, { [v]: a }))}`);
      break;
    }
  }
})));
onEnter('#term-in', () => $('[data-term="simplify"]').click());

// ---------- Funktionsplotter ----------
const COLORS = ['#2f6fde', '#d9544f', '#1f9d63', '#c78a00', '#8e5bd6', '#0f9bb3'];
function plot() {
  const cv = $('#plot');
  const W = cv.clientWidth, H = cv.clientHeight;
  if (!W) return;
  const dpr = window.devicePixelRatio || 1;
  cv.width = W * dpr; cv.height = H * dpr;
  const g = cv.getContext('2d');
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  const css = getComputedStyle(document.documentElement);
  const x0 = num('#plot-x0'), x1 = num('#plot-x1'), y0 = num('#plot-y0'), y1 = num('#plot-y1');
  const X = (x) => ((x - x0) / (x1 - x0)) * W, Y = (y) => H - ((y - y0) / (y1 - y0)) * H;
  g.clearRect(0, 0, W, H);
  // Raster
  const step = (r) => { const s = Math.pow(10, Math.floor(Math.log10(r / 8))); return r / s > 40 ? s * 5 : r / s > 16 ? s * 2 : s; };
  const sx = step(x1 - x0), sy = step(y1 - y0);
  g.font = '11px system-ui'; g.fillStyle = css.getPropertyValue('--muted');
  g.strokeStyle = css.getPropertyValue('--border'); g.lineWidth = 1;
  for (let x = Math.ceil(x0 / sx) * sx; x <= x1; x += sx) {
    g.beginPath(); g.moveTo(X(x), 0); g.lineTo(X(x), H); g.stroke();
    if (Math.abs(x) > 1e-9) g.fillText(fmt(+x.toFixed(6)), X(x) + 2, Math.min(Math.max(Y(0) + 12, 12), H - 4));
  }
  for (let y = Math.ceil(y0 / sy) * sy; y <= y1; y += sy) {
    g.beginPath(); g.moveTo(0, Y(y)); g.lineTo(W, Y(y)); g.stroke();
    if (Math.abs(y) > 1e-9) g.fillText(fmt(+y.toFixed(6)), Math.min(Math.max(X(0) + 3, 3), W - 30), Y(y) - 2);
  }
  g.strokeStyle = css.getPropertyValue('--text'); g.lineWidth = 1.5;
  g.beginPath(); g.moveTo(0, Y(0)); g.lineTo(W, Y(0)); g.moveTo(X(0), 0); g.lineTo(X(0), H); g.stroke();
  // Funktionen
  const fns = normalize($('#plot-in').value).split(';').map((f) => f.trim()).filter(Boolean);
  const legend = [];
  fns.forEach((f, i) => {
    const color = COLORS[i % COLORS.length];
    try {
      const c = math.compile(f.replace(/^\s*[fy]\s*\(?x?\)?\s*=/, ''));
      g.strokeStyle = color; g.lineWidth = 2.2; g.beginPath();
      let pen = false, prev = null;
      for (let px = 0; px <= W; px += 1) {
        const x = x0 + (px / W) * (x1 - x0);
        let y; try { y = realOf(c.evaluate({ x })); } catch (_) { y = NaN; }
        const py = Y(y);
        if (!isFinite(py) || (prev !== null && Math.abs(py - prev) > H * 2)) { pen = false; prev = isFinite(py) ? py : null; continue; }
        pen ? g.lineTo(px, py) : g.moveTo(px, py);
        pen = true; prev = py;
      }
      g.stroke();
      legend.push(`<span><i style="background:${color}"></i>${esc(f)}</span>`);
    } catch (e) {
      legend.push(`<span style="color:var(--err)">${esc(f)}: ${esc(e.message)}</span>`);
    }
  });
  $('#plot-legend').innerHTML = legend.join('');
}
$('#plot-go').onclick = plot;
onEnter('#plot-in', plot);
['#plot-x0', '#plot-x1', '#plot-y0', '#plot-y1'].forEach((id) => onEnter(id, plot));
window.addEventListener('resize', () => { if ($('#plotter').classList.contains('active')) plot(); });

// ---------- Geometrie ----------
const PI = Math.PI;
const SHAPES = {
  'Quadrat': { f: ['a'], r: ({ a }) => [['Fläche A = a²', a * a], ['Umfang U = 4a', 4 * a], ['Diagonale d = a·√2', a * Math.SQRT2]] },
  'Rechteck': { f: ['a', 'b'], r: ({ a, b }) => [['Fläche A = a·b', a * b], ['Umfang U = 2(a+b)', 2 * (a + b)], ['Diagonale d = √(a²+b²)', Math.hypot(a, b)]] },
  'Dreieck (Grundseite g, Höhe h)': { f: ['g', 'h'], r: ({ g, h }) => [['Fläche A = ½·g·h', (g * h) / 2]] },
  'Dreieck (drei Seiten a, b, c)': {
    f: ['a', 'b', 'c'], r: ({ a, b, c }) => {
      if (a + b <= c || a + c <= b || b + c <= a) throw new Error('Mit diesen Seiten gibt es kein Dreieck (Dreiecksungleichung).');
      const s = (a + b + c) / 2, A = Math.sqrt(s * (s - a) * (s - b) * (s - c));
      const ang = (x, y, z) => (Math.acos((y * y + z * z - x * x) / (2 * y * z)) * 180) / PI;
      return [['Umfang U = a+b+c', 2 * s], ['Fläche (Heron) A = √(s(s−a)(s−b)(s−c))', A],
        ['Winkel α (Kosinussatz)', ang(a, b, c) + '°'], ['Winkel β', ang(b, a, c) + '°'], ['Winkel γ', ang(c, a, b) + '°']];
    },
  },
  'Rechtwinkliges Dreieck (Pythagoras: Katheten a, b)': {
    f: ['a', 'b'], r: ({ a, b }) => [['Hypotenuse c = √(a²+b²)', Math.hypot(a, b)], ['Fläche A = ½·a·b', (a * b) / 2],
      ['Umfang U', a + b + Math.hypot(a, b)], ['Winkel α = arctan(a/b)', (Math.atan(a / b) * 180) / PI + '°'], ['Winkel β', (Math.atan(b / a) * 180) / PI + '°']],
  },
  'Kreis': { f: ['r'], r: ({ r }) => [['Fläche A = π·r²', PI * r * r], ['Umfang U = 2·π·r', 2 * PI * r], ['Durchmesser d = 2r', 2 * r]] },
  'Kreisausschnitt (Radius r, Winkel α in °)': { f: ['r', 'α'], r: ({ r, α }) => [['Fläche A = π·r²·α/360', (PI * r * r * α) / 360], ['Bogenlänge b = 2·π·r·α/360', (2 * PI * r * α) / 360]] },
  'Trapez (a, c parallel, Höhe h)': { f: ['a', 'c', 'h'], r: ({ a, c, h }) => [['Fläche A = ½(a+c)·h', ((a + c) * h) / 2], ['Mittellinie m = ½(a+c)', (a + c) / 2]] },
  'Parallelogramm': { f: ['g', 'h'], r: ({ g, h }) => [['Fläche A = g·h', g * h]] },
  'Raute (Diagonalen e, f)': { f: ['e', 'f'], r: ({ e, f }) => [['Fläche A = ½·e·f', (e * f) / 2], ['Seite a = ½·√(e²+f²)', Math.hypot(e, f) / 2], ['Umfang U = 4a', 2 * Math.hypot(e, f)]] },
  'Würfel': { f: ['a'], r: ({ a }) => [['Volumen V = a³', a ** 3], ['Oberfläche O = 6a²', 6 * a * a], ['Raumdiagonale d = a·√3', a * Math.sqrt(3)]] },
  'Quader': { f: ['a', 'b', 'c'], r: ({ a, b, c }) => [['Volumen V = a·b·c', a * b * c], ['Oberfläche O = 2(ab+ac+bc)', 2 * (a * b + a * c + b * c)], ['Raumdiagonale d = √(a²+b²+c²)', Math.hypot(a, b, c)]] },
  'Zylinder': { f: ['r', 'h'], r: ({ r, h }) => [['Volumen V = π·r²·h', PI * r * r * h], ['Mantel M = 2·π·r·h', 2 * PI * r * h], ['Oberfläche O = 2πr² + 2πrh', 2 * PI * r * (r + h)]] },
  'Kegel': {
    f: ['r', 'h'], r: ({ r, h }) => {
      const s = Math.hypot(r, h);
      return [['Mantellinie s = √(r²+h²)', s], ['Volumen V = ⅓·π·r²·h', (PI * r * r * h) / 3], ['Mantel M = π·r·s', PI * r * s], ['Oberfläche O = πr² + πrs', PI * r * (r + s)]];
    },
  },
  'Kugel': { f: ['r'], r: ({ r }) => [['Volumen V = ⁴⁄₃·π·r³', (4 / 3) * PI * r ** 3], ['Oberfläche O = 4·π·r²', 4 * PI * r * r]] },
  'Quadratische Pyramide (Grundkante a, Höhe h)': {
    f: ['a', 'h'], r: ({ a, h }) => {
      const hs = Math.hypot(h, a / 2);
      return [['Volumen V = ⅓·a²·h', (a * a * h) / 3], ['Seitenhöhe hₛ = √(h² + (a/2)²)', hs], ['Oberfläche O = a² + 2·a·hₛ', a * a + 2 * a * hs]];
    },
  },
};
const geoSel = $('#geo-shape');
Object.keys(SHAPES).forEach((k) => geoSel.add(new Option(k, k)));
function geoFields() {
  $('#geo-fields').innerHTML = SHAPES[geoSel.value].f.map((f) => `<label>${f} = <input data-geo="${f}" inputmode="decimal"></label>`).join('');
  $('#geo-out').innerHTML = '';
  $$('[data-geo]').forEach((i) => i.addEventListener('keydown', (e) => { if (e.key === 'Enter') geoCalc(); }));
}
const geoCalc = guard('#geo-out', () => {
  const sh = SHAPES[geoSel.value];
  const vals = {};
  for (const el of $$('[data-geo]')) {
    const x = Number(math.evaluate(normalize(el.value || 'NaN')));
    if (!(x > 0)) throw new Error(`Bitte für ${el.dataset.geo} eine positive Zahl eingeben.`);
    vals[el.dataset.geo] = x;
  }
  const rows = sh.r(vals).map(([k, v]) => [k, typeof v === 'string' ? fmt(Math.round(parseFloat(v) * 1e6) / 1e6) + '°' : fmt(Math.round(v * 1e9) / 1e9)]);
  $('#geo-out').innerHTML = table(rows);
});
geoSel.onchange = geoFields;
$('#geo-go').onclick = geoCalc;
geoFields();

// ---------- Prozent & Dreisatz ----------
const percent = guard('#p-out', () => {
  const G = num('#p-g'), p = num('#p-p'), W = num('#p-w');
  const filled = [G, p, W].filter((x) => !isNaN(x)).length;
  if (filled !== 2) throw new Error('Genau zwei der drei Felder ausfüllen.');
  let out;
  if (isNaN(W)) out = steps([`W = G · p / 100 = ${fmt(G)} · ${fmt(p)} / 100`]) + result(`Prozentwert W = ${fmt(G * p / 100)}`);
  else if (isNaN(p)) out = steps([`p = W / G · 100 = ${fmt(W)} / ${fmt(G)} · 100`]) + result(`Prozentsatz p = ${fmt(W / G * 100)} %`);
  else out = steps([`G = W · 100 / p = ${fmt(W)} · 100 / ${fmt(p)}`]) + result(`Grundwert G = ${fmt(W * 100 / p)}`);
  $('#p-out').innerHTML = out;
});
$('#p-go').onclick = percent;
['#p-g', '#p-p', '#p-w'].forEach((id) => onEnter(id, percent));

const dreisatz = guard('#d-out', () => {
  const a = num('#d-a'), b = num('#d-b'), c = num('#d-c');
  if ([a, b, c].some(isNaN)) throw new Error('Bitte alle drei Werte eingeben.');
  const anti = $('#d-mode').value === 'anti';
  const one = anti ? a * b : b / a;
  const res = anti ? one / c : one * c;
  $('#d-out').innerHTML = steps([
    `${fmt(a)} ≙ ${fmt(b)}`,
    `1 ≙ ${fmt(b)} ${anti ? '·' : ':'} ${fmt(a)} = ${fmt(one)}`,
    `${fmt(c)} ≙ ${fmt(one)} ${anti ? ':' : '·'} ${fmt(c)} = ${fmt(res)}`,
  ]) + result(`${fmt(c)} ≙ ${fmt(res)}`);
});
$('#d-go').onclick = dreisatz;

// ---------- Statistik ----------
const stats = guard('#stat-out', () => {
  const raw = $('#stat-in').value.trim();
  let parts = raw.split(/[;\s]+/).filter(Boolean);
  if (parts.length === 1 && parts[0].includes(',')) parts = parts[0].split(',');
  const xs = parts.map((p) => Number(p.replace(',', '.')));
  if (!xs.length || xs.some(isNaN)) throw new Error('Bitte nur Zahlen eingeben.');
  const sorted = [...xs].sort((a, b) => a - b);
  const n = xs.length, sum = math.sum(xs), mean = sum / n;
  const modes = math.mode(xs);
  const rows = [
    ['Anzahl n', n], ['Sortiert', sorted.map(fmt).join('; ')], ['Summe', fmt(sum)],
    ['Arithmetisches Mittel x̄', fmt(mean)], ['Median', fmt(math.median(xs))],
    ['Modus (häufigster Wert)', modes.length === n && n > 1 ? 'keiner' : modes.map(fmt).join('; ')],
    ['Minimum', fmt(sorted[0])], ['Maximum', fmt(sorted[n - 1])], ['Spannweite', fmt(sorted[n - 1] - sorted[0])],
    ['1. Quartil Q₁', fmt(math.quantileSeq(xs, 0.25))], ['3. Quartil Q₃', fmt(math.quantileSeq(xs, 0.75))],
    ['Varianz (Grundgesamtheit) σ²', fmt(math.variance(xs, 'uncorrected'))],
    ['Standardabweichung σ', fmt(math.std(xs, 'uncorrected'))],
  ];
  if (n > 1) rows.push(['Varianz (Stichprobe) s²', fmt(math.variance(xs))], ['Standardabweichung (Stichprobe) s', fmt(math.std(xs))]);
  if (xs.every((x) => x > 0)) rows.push(['Geometrisches Mittel', fmt(Math.pow(xs.reduce((p, x) => p * x, 1), 1 / n))]);
  $('#stat-out').innerHTML = table(rows);
});
$('#stat-go').onclick = stats;

// ---------- Teiler & Primzahlen ----------
function factorize(n) {
  const f = [];
  for (let p = 2; p * p <= n; p += p === 2 ? 1 : 2) while (n % p === 0) { f.push(p); n /= p; }
  if (n > 1) f.push(n);
  return f;
}
function divisors(n) {
  const lo = [], hi = [];
  for (let i = 1; i * i <= n; i++) if (n % i === 0) { lo.push(i); if (i !== n / i) hi.unshift(n / i); }
  return lo.concat(hi);
}
const numbers = guard('#num-out', () => {
  const ns = $('#num-in').value.split(/[;,\s]+/).filter(Boolean).map(Number);
  if (!ns.length || ns.some((x) => !Number.isInteger(x) || x < 1 || x > 1e12)) throw new Error('Bitte ganze Zahlen zwischen 1 und 10¹² eingeben.');
  let html = '';
  if (ns.length > 1) {
    const g = ns.reduce(gcd), l = ns.reduce(lcm);
    html += result(`ggT(${ns.join(', ')}) = ${g}`, `kgV(${ns.join(', ')}) = ${l}`);
  }
  html += table(ns.flatMap((n) => {
    const f = factorize(n);
    const grouped = {};
    f.forEach((p) => { grouped[p] = (grouped[p] || 0) + 1; });
    const fstr = n === 1 ? '1' : Object.entries(grouped).map(([p, e]) => (e > 1 ? `${p}<sup>${e}</sup>` : p)).join(' · ');
    const rows = [[`<b>${n}</b>`, f.length === 1 ? 'Primzahl ✓' : n === 1 ? 'weder prim noch zusammengesetzt' : 'zusammengesetzt'], ['Primfaktorzerlegung', fstr]];
    if (n <= 1e9) { const d = divisors(n); rows.push([`Teiler (${d.length})`, d.length > 60 ? d.slice(0, 60).join(', ') + ' …' : d.join(', ')]); }
    return rows;
  }));
  $('#num-out').innerHTML = html;
});
$('#num-go').onclick = numbers;
onEnter('#num-in', numbers);

// ---------- Einheiten ----------
const units = guard('#unit-out', () => {
  const raw = $('#unit-in').value.trim();
  if (!raw) return;
  const s = normalize(raw).replace(/\s+in\s+/i, ' to ').replace(/°C/g, 'degC').replace(/°F/g, 'degF');
  const r = math.evaluate(s);
  $('#unit-out').innerHTML = result(`${esc(raw)} = ${fmt(r)}`);
});
$('#unit-go').onclick = units;
onEnter('#unit-in', units);
})();
