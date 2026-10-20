import './style.css';
import { KERN, clamp, sdof, crushing, failure, column, maximum, profile, dimensional, wytheRatio } from './physics.js';

const lessons = [
  { title: 'Eccentricity & cracking', short: 'No-tension model', ref: 'Chapter 5 · §5.2.1', intro: 'A small eccentricity changes the entire equilibrium path.', text: 'A rigid pier stands on a thin elastic layer that carries compression but no tension. As the pier rotates, the load moves further from the section centre. Beyond the kern, part of the layer opens and its stiffness decreases.', formula: 'P / Pᴇ = 1 − ε / δ  (δ ≤ 1/6)\nP / Pᴇ = (27/2)(δ − ε)(1 − 2δ)²  (δ > 1/6)\nPᴄʀ / Pᴇ = (1 − 2ε)³', task: 'Set ε = 0.10. Move along the curve to the peak, then continue beyond it. Watch the compressed depth shrink.', question: 'What happens after the peak under increasing displacement?', answers: ['The load must decrease', 'The load keeps increasing', 'The section recovers its full stiffness'], correct: 0, feedback: 'The descending branch requires a reduction in load. It is unstable under load control: cracking, softening and second-order effects reinforce one another.' },
  { title: 'Crushing or buckling?', short: 'Finite strength', ref: 'Chapter 5 · §5.2.2', intro: 'Two limits compete: stress capacity and equilibrium.', text: 'Keep the same rigid-pier model, but give the layer a finite, brittle compressive strength. Failure is the first crushing limit reached on the rising equilibrium path, or its peak. β = Pᴄ / Pᴇ describes the competition.', formula: 'β = 12 σᴄ a H / (E t²)\nP* / Pᴇ = β / (1 + 6δ)  (δ ≤ 1/6)\nP* / Pᴇ = (3/4)β(1 − 2δ)  (δ > 1/6)', task: 'At ε = 0.10, compare β = 0.30, 1.00 and 2.00 using the presets. Identify the three failure regimes.', question: 'Which limit defines the failure load?', answers: ['The lowest point of the descending branch', 'The first crushing intersection or the peak', 'The Euler load in every case'], correct: 1, feedback: 'Follow the rising path from the unloaded configuration. A crushing intersection stops this path; otherwise the equilibrium maximum governs.' },
  { title: 'A deformable column', short: 'Sahlin & Yokel', ref: 'Chapter 5 · §5.3', intro: 'Cracking propagates along the column, not only at its base.', text: 'A doubly pinned column of total height H = 2l bends under equal end eccentricities. Sahlin’s solution joins an uncracked elastic region to a cracked region. When ε ≥ 1/6, Yokel describes the entirely cracked column with one universal curve.', formula: 'Pᴇ = π² E J / H²;  J = b t³ / 12\nP / Pᴇ = 4(αl)² / π²\nk = (1/2 − δ) / (1/2 − ε)\nPᴄʀ / Pᴇq ≈ 0.2837 at k ≈ 0.61165', task: 'Start at ε = 0.05 and pass the kern threshold. Then set ε = 0.20: every section is cracked from the start.', question: 'The value 0.2837 is normalized by which load?', answers: ['The Euler load of the full section', 'The crushing load', 'The Euler load of the end compressed section'], correct: 2, feedback: 'Pᴇq uses Jᴇ = b[3(t/2 − e)]³/12. That reference section is already smaller than the full section, so the loss relative to Pᴇ is even larger.' },
  { title: 'Walls with several wythes', short: 'Multi-wythe walls', ref: 'Chapter 5 · §5.4', intro: 'Nominal thickness is not always structural thickness.', text: 'Compare a monolithic wall with independent, equal-thickness wythes. Both have the same total thickness, material and height. Without transverse connection, each wythe buckles separately. This comparison uses centred compression and identical pinned supports.', formula: 'Jmono = b t³ / 12\nΣJwythe = n · b(t/n)³ / 12\nΣPᴇ,wythe / Pᴇ,mono = 1 / n²', task: 'Compare two, three and four independent wythes. Keep the total thickness fixed and observe how quickly capacity falls.', question: 'Two independent equal wythes retain what fraction of monolithic Euler capacity?', answers: ['One half', 'One quarter', 'The full capacity'], correct: 1, feedback: 'Each half-thickness wythe has 1/8 of the original bending inertia. Two wythes together retain 2/8 = 1/4 of the monolithic Euler capacity.' }
];
const state = { step: 0, e: .1, d: .2, beta: 1, compare: false, n: 2, E: 2000, t: 300, b: 1000, H: 4000, a: 100, answers: {}, completed: new Set() };
const eccentricityCurves = [
  { e: 0, label: '0', color: '#16803d' },
  { e: 1 / 24, label: '1/24', color: '#168ab8' },
  { e: 1 / 12, label: '1/12', color: '#c13c38' },
  { e: 1 / 6, label: '1/6', color: '#8050a6' },
  { e: 1 / 4, label: '1/4', color: '#242c32' }
];
const betaCurves = [2, 1, .5, .25];
const fmt = (v, digits = 3) => Number(v).toLocaleString('en-GB', { maximumFractionDigits: digits, minimumFractionDigits: digits });
const app = document.querySelector('#app');
app.innerHTML = `<header><a class="brand" href="./" aria-label="BuCoWal home"><span class="brandmark">▥</span><span><strong>BuCoWal</strong><small>MASONRY STABILITY LAB</small></span></a><span class="header-note">Chapter 5 · Guided learning</span><div class="header-actions"><button id="theory-open" aria-haspopup="dialog">Theory & credits</button><button id="reset">Reset lesson</button></div></header>
<div class="course"><nav id="steps" aria-label="Learning path"></nav><div class="progress"><span id="progress-text"></span><progress id="progress" max="4" value="0"></progress></div></div>
<main><div class="intro"><div><span class="eyebrow" id="reference"></span><h1 id="title"></h1><p id="intro"></p></div><span class="pill">No-tension masonry</span></div>
<div class="workspace"><aside class="panel controls"><div class="panel-head"><h2>01 <span>Set up</span></h2></div><div class="panel-content"><div id="model-controls"></div><details open><summary>Geometry & material</summary><p class="help" id="geometry-note"></p><div id="geometry"></div></details><p class="help" id="assumptions"></p></div></aside>
<section class="panel experiment"><div class="panel-head"><h2>02 <span>Explore equilibrium</span></h2><span id="branch" class="badge"></span></div><div class="visuals"><div id="scene"></div><div id="plot"></div></div><div class="legend" id="legend"></div><div class="transport" id="transport"></div><div class="metrics" id="metrics" aria-live="polite"></div></section>
<aside class="panel learn"><div class="panel-head"><h2>03 <span>Understand</span></h2></div><div class="panel-content"><p id="explanation"></p><div class="equation" id="formula"></div><div id="live-explanation" class="insight"></div><div class="task"><span class="eyebrow">TRY THIS</span><p id="task"></p><div id="presets"></div></div><fieldset class="quiz"><legend id="question"></legend><div id="answers"></div><p id="feedback" role="status"></p></fieldset></div></aside></div>
<div class="lesson-footer"><span id="lesson-status">Explore the model, then answer the checkpoint.</span><div><button id="previous">← Previous</button><button id="next" class="primary">Next lesson →</button></div></div>
</main><footer>BuCoWal · v0.1 <span>Based on Chapter 5 of <cite>Principles and Analysis of Historical Masonry Structures</cite> · Castellazzi & Taliercio</span></footer>
<dialog id="theory-dialog" aria-labelledby="theory-title"><div class="theory-head"><div><span class="eyebrow">CHAPTER 5</span><h2 id="theory-title">Theory & experimental context</h2></div><button id="theory-close" aria-label="Close theory">Close</button></div><div class="theory-body"><h3>Reading the deformation</h3><p>Δ is the current eccentricity, including the initial eccentricity e; δ = Δ/t and ε = e/t are their dimensionless forms. The extra lateral displacement is Δ − e. The diagrams use the selected equilibrium solution; dimensions are schematic and thickness is exaggerated for readability.</p><h3>Compression and opening</h3><p>Masonry carries compression but no tension in these models. Red shading marks the open, non-compressed part of a section when the force lies outside the central kern (±t/6). Green marks the compressed part.</p><h3>What the experiments show</h3><p>The photoelastic dry-stacked PMMA pillars discussed in Chapter 5 (Geiger et al., 2018) show compressed stress regions, progressive opening and a mid-height hinge. They illustrate why loss of equilibrium can precede crushing. This laboratory is a theoretical model, not a fitted experimental dataset.</p><h3>Scope of the four models</h3><p>Linear elasticity in compression, zero tensile strength and small-displacement curvature with second-order equilibrium. Finite compressive strength is included in the rigid-pier model. The deformable-column lesson assumes unlimited compressive strength. The wall lesson compares two ideal connection limits; it does not model partial connection or an incoherent core.</p><h3>Book credits</h3><p><strong>Giovanni Castellazzi and Alberto Taliercio</strong>, <cite>Principles and Analysis of Historical Masonry Structures: The Strength of the Past</cite>. 498 pages. Civil and Structural Engineering; History and Philosophy of Science.</p><dl class="book-editions"><div><dt>Hardback · 15 September 2025</dt><dd>ISBN 1-0364-5633-1 · ISBN13 978-1-0364-5633-7</dd></div><div><dt>Paperback · 15 June 2026</dt><dd>ISBN 1-0364-7801-7 · ISBN13 978-1-0364-7801-8</dd></div><div><dt>Ebook</dt><dd>ISBN13 978-1-0364-5634-4</dd></div></dl><p class="book-codes">BIC: TNC, TN, TBX · BISAC: TEC063000, TEC005060, TEC056000, ARC014010, ARC009000, ARC005000 · THEMA: TNC, TN, TBX</p></div></dialog>`;

function field(key, label, min, max, step, unit = '') {
  return `<label class="field">${label}<span>${unit}</span><input type="number" data-geometry="${key}" min="${min}" max="${max}" step="${step}" value="${state[key]}" required></label>`;
}
function peak() { return state.step === 2 ? maximum(d => column(d, state.e), Math.max(state.e, KERN)) : { d: (1 + 4 * state.e) / 6, p: (1 - 2 * state.e) ** 3 }; }
function load(d) { return state.step === 2 ? column(d, state.e) : sdof(d, state.e); }
function renderLesson() {
  const l = lessons[state.step];
  document.querySelector('#steps').innerHTML = lessons.map((x, i) => `<button data-step="${i}" class="${i === state.step ? 'active' : ''}" aria-current="${i === state.step ? 'step' : 'false'}"><span class="step-number">${state.completed.has(i) ? '✓' : i + 1}</span><span>${x.short}</span></button>`).join('');
  for (const [id, value] of Object.entries({reference: l.ref, title: l.title, intro: l.intro, explanation: l.text, formula: l.formula, task: l.task, question: l.question})) document.getElementById(id).textContent = value;
  document.querySelector('#model-controls').innerHTML = state.step === 3 ? `<label class="field">Independent wythes <output id="n-output">${state.n}</output><input id="n" type="range" min="1" max="6" step="1" value="${state.n}"></label>` : `<label class="field">Initial eccentricity ε = e/t <output id="e-output">${fmt(state.e)}</output><input id="e" type="range" min="0" max="0.45" step="0.005" value="${state.e}"></label><button id="compare" class="compare-button" aria-pressed="${state.compare}">${state.compare ? 'Show selected curve' : 'Compare e/t curves'}</button><p class="help">Kern boundary: ε = 1/6 ≈ 0.167</p>${state.step === 1 ? `<label class="field">Strength ratio β = Pᴄ/Pᴇ <output id="beta-output">${fmt(state.beta, 2)}</output><input id="beta" type="range" min="0.05" max="4" step="0.05" value="${state.beta}"></label><p class="help">β is independent here; σᴄ is derived from the geometry below.</p>` : ''}`;
  document.querySelector('#geometry').innerHTML = field('H', state.step < 2 ? 'Rigid height H = l' : 'Total height H = 2l', 100, 20000, 100, 'mm') + field('t', 'Total thickness t', 10, 2000, 10, 'mm') + field('b', 'Section depth b', 10, 10000, 10, 'mm') + field('E', 'Elastic modulus E', 10, 50000, 100, 'MPa') + (state.step < 2 ? field('a', 'Elastic layer a', 1, state.H - 1, 1, 'mm') : '');
  document.querySelector('#geometry-note').textContent = state.step < 2 ? 'Rigid pier on a deformable base layer. H is the rigid height, not a pinned-column effective length.' : 'Pinned at both ends; Euler bending about the thickness direction.';
  document.querySelector('#assumptions').textContent = state.step === 3 ? 'Centred load. Equal wythes with uniform axial load sharing. No composite action in the independent case.' : 'Rectangular section · Small-displacement kinematics · Zero tensile strength';
  document.querySelector('#answers').innerHTML = l.answers.map((a, i) => `<label><input type="radio" name="checkpoint" value="${i}" ${state.answers[state.step] === i ? 'checked' : ''}>${a}</label>`).join('');
  document.querySelector('#presets').innerHTML = (state.step === 1 ? [['Stocky', .1, .3], ['Intermediate', .1, 1], ['Slender', .1, 2]] : state.step === 2 ? [['Progressive cracking', .05], ['Entirely cracked', .2]] : state.step === 0 ? [['Centred', 0], ['Small offset', .1], ['Outside kern', .2]] : []).map(([name,e,beta]) => `<button data-preset="${e}" ${beta ? `data-beta="${beta}"` : ''}>${name}</button>`).join('');
  document.querySelector('#previous').disabled = state.step === 0;
  document.querySelector('#next').disabled = state.step === 3;
  updateCheckpoint(); updateExperiment();
}
function updateCheckpoint() {
  const answer = state.answers[state.step], l = lessons[state.step], right = answer === l.correct;
  document.querySelector('#feedback').textContent = answer === undefined ? '' : right ? `Correct. ${l.feedback}` : 'Try again. Explore the curve and reread the model explanation.';
  document.querySelector('#feedback').className = right ? 'correct' : '';
  document.querySelector('#progress').value = state.completed.size;
  document.querySelector('#progress-text').textContent = `${state.completed.size} / 4 checkpoints`;
  document.querySelector('#lesson-status').textContent = right ? 'Checkpoint complete. Continue when you are ready.' : 'Explore the model, then answer the checkpoint.';
}
function svg(content, box, label, cls = '') { return `<svg viewBox="${box}" role="img" aria-label="${label}" class="${cls}"><defs><marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0L10 5L0 10Z" fill="#b34a32"/></marker></defs>${content}</svg>`; }
function diagram(p) {
  const { d, e, step } = state, t = 72, baseline = 205;
  const w = step === 2 ? Array.from({length: 61}, (_, i) => profile(d, e, Math.abs(i / 30 - 1))) : Array.from({length: 61}, (_, i) => e + (d - e) * (1 - i / 60));
  const cx = i => baseline + (step === 2 ? -1 : 1) * (w[i] - e) * t;
  const loadX = baseline + (step === 2 ? e : d) * t;
  let s = `<text x="18" y="26" class="svg-title">${step === 2 ? 'Pinned column · H = 2l' : 'Rigid pier · elastic base'}</text><text x="18" y="47" class="svg-muted">Dashed outline: undeformed</text><rect x="${baseline-t/2}" y="65" width="${t}" height="240" fill="none" stroke="#82918d" stroke-width="1.5" stroke-dasharray="5 4"/><path d="M${baseline} 52V335" stroke="#9facaa" stroke-dasharray="4 4"/><path d="M${loadX} 38V335" stroke="#b34a32" stroke-dasharray="5 4"/>`;
  const left = w.map((v,i) => `${cx(i)-t/2},${65+i*4}`).join(' '), right = w.map((v,i) => `${cx(i)+t/2},${65+i*4}`).reverse().join(' ');
  s += `<polygon points="${left} ${right}" fill="#edf3f0" stroke="#8ba99e"/>`;
  if (step === 2) {
    const boundary = w.map((v,i) => `${cx(i)+t/2-Math.min(1,3*(.5-v))*t},${65+i*4}`);
    const compressed = boundary.join(' ');
    s += `<polygon points="${left} ${boundary.reverse().join(' ')}" fill="#d94b46" opacity=".5"/>`;
    s += `<polygon points="${compressed} ${right}" fill="#88c9b4" opacity=".8"/>`;
  } else {
    const eta = Math.min(1, 3*(.5-d));
    s += `<rect x="${baseline-t/2}" y="305" width="${t}" height="17" fill="#e8eded" stroke="#8ba99e"/><rect x="${baseline-t/2}" y="305" width="${t*(1-eta)}" height="17" fill="#d94b46" opacity=".5"/><rect x="${baseline+t/2-eta*t}" y="305" width="${eta*t}" height="17" fill="#88c9b4"/><path d="M155 327H255" stroke="#213b3e" stroke-width="3"/>`;
  }
  s += `<path d="M${loadX} 35V62" stroke="#b34a32" stroke-width="2" marker-end="url(#arrow)"/><text x="${loadX-25}" y="48" fill="#b34a32">P</text>`;
  if (step === 2) s += `<path d="M${baseline-7} 315L${baseline} 305L${baseline+7} 315Z" fill="white" stroke="#213b3e"/><path d="M${cx(0)-7} 55L${cx(0)} 65L${cx(0)+7} 55Z" fill="white" stroke="#213b3e"/>`;
  const eta = Math.min(1, 3*(.5-d)), stressMin = d <= KERN ? Math.max(0,(1-6*d)/(1+6*d)) : 0;
  const sectionT = 120, forceX = baseline + d*sectionT;
  s += `<text x="18" y="368" class="svg-title">${step === 2 ? 'Mid-height section' : 'Base layer section'}</text><rect x="${baseline-sectionT/2}" y="390" width="${sectionT}" height="15" fill="#edf3f0" stroke="#8ba99e"/><rect x="${baseline-sectionT/2}" y="390" width="${sectionT*(1-eta)}" height="15" fill="#d94b46" opacity=".5"/><rect x="${baseline+sectionT/2-eta*sectionT}" y="390" width="${eta*sectionT}" height="15" fill="#88c9b4"/><path d="M${baseline-sectionT/6} 381V410M${baseline+sectionT/6} 381V410" stroke="#8050a6" stroke-dasharray="3 2"/><path d="M${baseline} 380V410" stroke="#82918d" stroke-dasharray="2 3"/><path d="M${forceX} 372V387" stroke="#b34a32" stroke-width="2" marker-end="url(#arrow)"/><text x="${forceX+5}" y="380" class="svg-muted">P</text><text x="278" y="393" class="svg-muted">Kern ±t/6</text><text x="278" y="410" class="svg-muted">δ = Δ/t = ${fmt(d)}</text><polygon points="${baseline+sectionT/2-eta*sectionT},415 ${baseline+sectionT/2},415 ${baseline+sectionT/2},460 ${baseline+sectionT/2-eta*sectionT},${415+45*stressMin}" fill="#157b70" opacity="${p > 0 ? '.8' : '.15'}"/><text x="18" y="438">${d <= KERN ? 'Fully compressed' : 'Open region + compression'}</text><text x="18" y="482" class="svg-muted">η/t = ${fmt(eta)} · stress diagram normalized</text>`;
  return svg(s, '0 0 400 505', 'Deformed and dashed undeformed column; red open section, green compressed section, applied force and central kern');
}
function chart(fn, pk, fail) {
  const x = d => 55 + d / .5 * 445, y = p => 280 - p / 1.12 * 225;
  const curvePoints = (e, evaluate) => Array.from({length: 401}, (_, i) => {
    const d = e + (.5 - e) * i / 400;
    return `${x(d)},${y(evaluate(d, e))}`;
  }).join(' ');
  let s = `<text x="20" y="25" class="svg-title">Load–eccentricity path</text>`;
  for (let p=0;p<=1.001;p+=.25) s+=`<path d="M55 ${y(p)}H500" stroke="#e2eae5"/><text x="44" y="${y(p)+5}" text-anchor="end">${fmt(p,2)}</text>`;
  for (let d=0;d<=.501;d+=.1) s+=`<text x="${x(d)}" y="301" text-anchor="middle">${fmt(d,1)}</text>`;
  s+=`<path d="M55 55V280H500" fill="none" stroke="#8d9f99"/><text x="20" y="48">P / Pᴇ</text><text x="350" y="326">δ = Δ/t</text><path d="M${x(KERN)} 55V280" stroke="#b5c9bf" stroke-dasharray="3 4"/><text x="${x(KERN)+5}" y="68" class="svg-muted">Kern</text>`;
  s += '<defs><clipPath id="plot-clip"><rect x="55" y="55" width="445" height="225"/></clipPath></defs><g clip-path="url(#plot-clip)">';
  if (state.compare) {
    const evaluate = state.step === 2 ? column : sdof;
    for (const {e, color} of eccentricityCurves) {
      s += `<polyline points="${curvePoints(e, evaluate)}" fill="none" stroke="${color}" stroke-width="2.5"/>`;
      if (e === 0) s += `<path d="M55 ${y(0)}V${y(1)}" stroke="${color}" stroke-width="2.5"/>`;
    }
    if (!eccentricityCurves.some(({e}) => Math.abs(e - state.e) < 1e-6))
      s += `<polyline points="${curvePoints(state.e, evaluate)}" fill="none" stroke="#82918d" stroke-width="1.7" stroke-dasharray="2 4"/>`;
    if (state.step === 1) for (const beta of betaCurves)
      s += `<polyline points="${Array.from({length: 401}, (_, i) => {const d = i * .5 / 400; return `${x(d)},${y(crushing(d, beta))}`;}).join(' ')}" fill="none" stroke="#94762d" stroke-width="1.7" stroke-dasharray="6 5"/>`;
  } else {
    const pts = Array.from({length: 401}, (_,i)=>{const d=state.e+(.5-state.e)*i/400;return {d,p:fn(d)};});
    for (const post of [false,true]) {
      const points=pts.filter(v=> post ? v.d >= pk.d : v.d <= pk.d);
      points.push({d:pk.d,p:pk.p}); points.sort((a,b)=>a.d-b.d);
      s+=`<polyline points="${points.map(v=>`${x(v.d)},${y(v.p)}`).join(' ')}" fill="none" stroke="${post?'#b34a32':'#157b70'}" stroke-width="2.7" ${post?'stroke-dasharray="5 4"':''}/>`;
    }
    if (state.e === 0) s+=`<path d="M55 ${y(0)}V${y(1)}" stroke="#157b70" stroke-width="2.7"/><text x="65" y="${y(.5)}" class="svg-muted">Straight branch</text>`;
    if(state.step===1) s+=`<polyline points="${Array.from({length:201},(_,i)=>{const d=i*.5/200;return `${x(d)},${y(crushing(d,state.beta))}`;}).join(' ')}" fill="none" stroke="#b48a30" stroke-width="2" stroke-dasharray="3 3"/>`;
  }
  s += '</g>';
  if (state.compare && state.step === 1) for (const beta of betaCurves)
    s += `<text x="${x(.2)+6}" y="${y(crushing(.2,beta))-5}" class="beta-label">β=${beta}</text>`;
  if (!state.compare && state.step === 1) s+=`<circle cx="${x(fail.d)}" cy="${y(fail.p)}" r="5" fill="#b48a30"/><text x="${Math.min(395,x(fail.d)+8)}" y="${y(fail.p)-12}" fill="#896717">First failure</text>`;
  if (!state.compare) s+=`<circle cx="${x(pk.d)}" cy="${y(pk.p)}" r="4" fill="#157b70"/>`;
  s += `<circle cx="${x(state.d)}" cy="${y(fn(state.d))}" r="6" fill="#213b3e" stroke="white" stroke-width="2"/><text x="65" y="348" class="svg-muted">Click the plot or use the slider to inspect an equilibrium.</text>`;
  return svg(s,'0 0 535 365',state.compare?'Comparison of normalized equilibrium curves for five initial eccentricities'+(state.step===1?' and four dashed strength limits.':'.'):'Normalized equilibrium curve. Use the current eccentricity slider for keyboard control.','curve');
}
function wall() {
  const n=state.n, ratio=wytheRatio(n), forces=dimensional(state);
  let s='<text x="20" y="26" class="svg-title">Same total thickness, different structural action</text>';
  for (const separate of [false,true]) {
    const base=separate?300:125;
    for(let j=0;j<(separate?n:1);j++) {
      const width=separate?90/n:90, bx=base-45+j*width;
      s+=`<path d="M${bx} 65Q${bx+22} 180 ${bx} 295L${bx+width-(separate?3:0)} 295Q${bx+width+22} 180 ${bx+width-(separate?3:0)} 65Z" fill="${separate?'#b9d4c6':'#88c9b4'}" stroke="#157b70"/>`;
    }
    s+=`<path d="M${base} 38V62" stroke="#b34a32" stroke-width="2" marker-end="url(#arrow)"/><text x="${base}" y="324" text-anchor="middle">${separate?`${n} independent ${n===1?'wythe':'wythes'}`:'Monolithic wall'}</text>`;
  }
  document.querySelector('#scene').innerHTML=svg(s,'0 0 430 355','Comparison of monolithic and independent wythes; schematic buckling modes');
  document.querySelector('#plot').innerHTML=svg(`<text x="20" y="26" class="svg-title">Euler capacity · relative to monolithic wall</text><rect x="65" y="70" width="390" height="42" rx="4" fill="#edf3f0"/><rect x="65" y="70" width="390" height="42" rx="4" fill="#157b70"/><text x="65" y="60">Monolithic · 100%</text><rect x="65" y="168" width="390" height="42" rx="4" fill="#edf3f0"/><rect x="65" y="168" width="${390*ratio}" height="42" rx="4" fill="#88c9b4"/><text x="65" y="158">Independent · ${fmt(ratio*100,1)}%</text><text x="65" y="258" class="svg-muted">The total thickness and material remain unchanged.</text>`, '0 0 535 355','Euler capacity comparison');
  document.querySelector('#metrics').innerHTML=metric('Monolithic Pᴇ',`${fmt(forces.columnEuler,1)} kN`)+metric('Sum of wythe Pᴇ',`${fmt(forces.columnEuler*ratio,1)} kN`)+metric('Capacity retained',`${fmt(ratio*100,1)}%`);
  document.querySelector('#live-explanation').textContent=`Each wythe is ${fmt(state.t/n,1)} mm thick. ${n === 1 ? 'With one wythe, both reference cases coincide.' : `Without transverse connection, the combined Euler capacity is reduced by a factor of ${n*n}.`}`;
}
function metric(label,value) { return `<div><small>${label}</small><strong>${value}</strong></div>`; }
function updateExperiment() {
  for(const k of ['e','beta','n']) {const el=document.querySelector(`#${k}-output`);if(el)el.textContent=k==='n'?state.n:fmt(state[k],k==='beta'?2:3);}
  const walls=state.step===3;
  if (walls || !document.querySelector('#d')) document.querySelector('#transport').innerHTML=walls?'':`<label for="d">Current eccentricity δ = Δ/t <output id="d-output">${fmt(state.d)}</output></label><input id="d" type="range" min="${state.e}" max="0.499" step="0.001" value="${state.d}"><button id="peak">Go to ${state.step===1?'failure':'peak'}</button>`;
  if (!walls) { const slider = document.querySelector('#d'); slider.min = state.e; slider.value = state.d; document.querySelector('#d-output').textContent = fmt(state.d); document.querySelector('#peak').textContent = state.step === 1 ? 'Go to failure' : 'Go to peak'; }
  document.querySelector('#legend').innerHTML=walls?'<span><i style="background:#157b70"></i>Monolithic action</span><span><i style="background:#88c9b4"></i>Independent action</span>':state.compare?eccentricityCurves.map(({label,color})=>`<span><i style="background:${color}"></i>e/t = ${label}</span>`).join('')+(state.step===1?'<span><i class="dashed-key"></i>β = 2, 1, 0.5, 0.25</span>':'')+(!eccentricityCurves.some(({e})=>Math.abs(e-state.e)<1e-6)?'<span><i class="selected-key"></i>Slider e/t</span>':''):'<span><i style="background:#157b70"></i>Pre-peak equilibrium</span><span><i style="background:#b34a32"></i>Post-peak · load-control instability</span>'+(state.step===1?'<span><i style="background:#b48a30"></i>Crushing limit</span>':'');
  if(walls) {document.querySelector('#branch').textContent='Centred Euler comparison';wall();return;}
  const pk=peak(), fail=state.step===1?failure(state.e,state.beta):pk, p=load(state.d), f=dimensional(state), pe=state.step===2?f.columnEuler:f.sdofEuler;
  document.querySelector('#scene').innerHTML=diagram(p);
  document.querySelector('#plot').innerHTML=chart(load,pk,fail);
  const beyond=state.step===1&&state.d>fail.d+1e-6;
  document.querySelector('#branch').textContent=beyond?'Beyond first failure':state.e===0&&state.d<=KERN?'Bifurcation branch':state.d>pk.d?'Post-peak equilibrium':'Pre-peak equilibrium';
  document.querySelector('#metrics').innerHTML=metric('Euler reference Pᴇ',`${fmt(pe,1)} kN`)+metric(state.step===1?'Failure load Pғ':'Buckling load Pᴄʀ',`${fmt(fail.p*pe,1)} kN`)+metric('Selected P / Pᴇ',fmt(p));
  let text=`Δ = ${fmt(state.d*state.t,1)} mm (δ = Δ/t = ${fmt(state.d)}); ${state.d<=KERN?'the selected section remains fully compressed':'only '+fmt(100*Math.min(1,3*(.5-state.d)),1)+'% of its depth carries compression'}. `;
  if(state.step===1) text+=`Failure mode: ${fail.mode.toLowerCase()}. Derived σᴄ = ${fmt(state.beta*pe*1000/(state.b*state.t))} MPa. ${beyond?'The displayed equilibrium is a theoretical continuation after failure.':''}`;
  if(state.step===2) text+=state.e>=KERN?`Entirely cracked column. k = ${fmt((.5-state.d)/(.5-state.e))}; Pᴄʀ/Pᴇq = ${fmt(pk.p/(27*(.5-state.e)**3),4)}.`:'Cracking starts at mid-height when δ exceeds 1/6; the end regions remain uncracked.';
  if(state.e===0&&state.d<=KERN) text+='For centred load, this is the bifurcation branch at P/Pᴇ = 1. The straight branch δ = 0 also exists below that load.';
  document.querySelector('#live-explanation').textContent=text;
}
app.addEventListener('click', event=> {
  const button=event.target.closest('button');
  if(button?.id==='theory-open') document.querySelector('#theory-dialog').showModal();
  if(button?.id==='theory-close') document.querySelector('#theory-dialog').close();
  if(button?.dataset.step!==undefined) {state.step=Number(button.dataset.step);state.d=Math.max(state.e+.02,Math.min(.49,state.d));renderLesson();}
  if(button?.id==='next'||button?.id==='previous') {state.step+=button.id==='next'?1:-1;renderLesson();}
  if(button?.id==='peak') {state.d=state.step===1?failure(state.e,state.beta).d:peak().d;updateExperiment();}
  if(button?.id==='compare') {state.compare=!state.compare;button.setAttribute('aria-pressed',String(state.compare));button.textContent=state.compare?'Show selected curve':'Compare e/t curves';updateExperiment();}
  if(button?.id==='reset') {state.e=.1;state.beta=1;state.d=.2;state.compare=false;state.n=2;delete state.answers[state.step];state.completed.delete(state.step);renderLesson();}
  if(button?.dataset.preset!==undefined) {state.e=Number(button.dataset.preset);if(button.dataset.beta)state.beta=Number(button.dataset.beta);state.d=state.step===1?failure(state.e,state.beta).d:peak().d;renderLesson();}
  const curve=event.target.closest('svg.curve');
  if(curve) {const point=curve.createSVGPoint();point.x=event.clientX;point.y=event.clientY;const local=point.matrixTransform(curve.getScreenCTM().inverse());state.d=clamp((local.x-55)/445*.5,state.e,.499);updateExperiment();}
});
app.addEventListener('input',event=> {
  const el=event.target;
  if(['e','beta','n','d'].includes(el.id)) {state[el.id]=Number(el.value);state.d=clamp(state.d,state.e,.499);updateExperiment();}
  if(el.dataset.geometry) {
    el.setCustomValidity('');
    if(!el.checkValidity())return;
    const key=el.dataset.geometry, v=Number(el.value);
    if((key==='H'&&state.step<2&&v<=state.a)||(key==='a'&&v>=state.H)) {el.setCustomValidity('The layer must be thinner than the rigid height.');el.reportValidity();return;}
    el.setCustomValidity('');state[key]=v;
    const aInput=document.querySelector('[data-geometry="a"]');if(aInput)aInput.max=state.H-1;
    updateExperiment();
  }
});
app.addEventListener('change',event=> {
  if(event.target.name==='checkpoint') {state.answers[state.step]=Number(event.target.value);if(state.answers[state.step]===lessons[state.step].correct)state.completed.add(state.step);else state.completed.delete(state.step);renderLesson();}
});
renderLesson();
