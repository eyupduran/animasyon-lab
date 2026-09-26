// Field-guide layer (SVG over the canvas): a thin leader line from a point in the scene to a name
// (and its Latin name), scale bars, the hour stamp, the chapter title, and small line diagrams.
// Elements are pooled by id; each frame the director re-declares what is visible.
import * as THREE from 'three';

const NS = 'http://www.w3.org/2000/svg';
const el = (tag, attrs = {}, parent) => { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); if (parent) parent.appendChild(e); return e; };

export class Overlay {
  constructor(svg, camera) {
    this.svg = svg; this.camera = camera;
    this.items = new Map(); this.used = new Set();
    this.W = 1600; this.H = 900;
    this.v = new THREE.Vector3();
  }
  resize(w, h) { this.W = w; this.H = h; this.svg.setAttribute('viewBox', `0 0 ${w} ${h}`); }
  get k() { return Math.max(0.62, Math.min(1.25, Math.min(this.W / 1600, this.H / 900) * 1.05)); }
  get portrait() { return this.H > this.W; }
  // 3D → screen px (null if behind)
  project(p) {
    this.v.copy(p).project(this.camera);
    if (this.v.z > 1) return null;
    return [(this.v.x * 0.5 + 0.5) * this.W, (-this.v.y * 0.5 + 0.5) * this.H];
  }
  begin() { this.used.clear(); }
  end() { for (const [id, it] of this.items) if (!this.used.has(id)) { if (it.g.style.display !== 'none') it.g.style.display = 'none'; } }
  item(id, make) {
    let it = this.items.get(id);
    if (!it) { const g = el('g', {}, this.svg); it = { g, ...make(g) }; this.items.set(id, it); }
    this.used.add(id);
    if (it.g.style.display === 'none') it.g.style.display = '';
    return it;
  }
  // leader label: anchor (screen [x,y] or THREE.Vector3), text, latin, dir: [dx,dy] offset of the text
  label(id, anchor, text, { latin = '', dir = [80, -60], op = 1, ink = 'light', size = 1 } = {}) {
    const a = anchor && anchor.isVector3 ? this.project(anchor) : anchor;
    if (!a || op <= 0.01) return;
    const k = this.k * size;
    const it = this.item(id, g => ({
      line: el('path', { class: 'lead' }, g), dot: el('circle', { r: 2.6, class: 'dot' }, g),
      t: el('text', { class: 'lab' }, g), l: el('text', { class: 'latin' }, g),
    }));
    const tx = a[0] + dir[0] * k, ty = a[1] + dir[1] * k;
    const right = dir[0] >= 0;
    it.g.setAttribute('class', 'fg ' + ink);
    it.g.style.opacity = op;
    it.dot.setAttribute('cx', a[0]); it.dot.setAttribute('cy', a[1]);
    const lx = tx + (right ? -6 : 6);
    it.line.setAttribute('d', `M${a[0]},${a[1]} L${lx},${ty} L${lx + (right ? 1 : -1) * 0},${ty}`);
    it.t.setAttribute('x', tx); it.t.setAttribute('y', ty - 3 * k);
    it.t.setAttribute('text-anchor', right ? 'start' : 'end');
    it.t.style.fontSize = (18 * k) + 'px';
    if (it.t.textContent !== text) it.t.textContent = text;
    it.l.setAttribute('x', tx); it.l.setAttribute('y', ty + 17 * k);
    it.l.setAttribute('text-anchor', right ? 'start' : 'end');
    it.l.style.fontSize = (16 * k) + 'px';
    if (it.l.textContent !== latin) it.l.textContent = latin;
  }
  // free text at screen position
  text(id, x, y, text, { cls = 'lab', op = 1, anchor = 'start', size = 18, ink = 'light' } = {}) {
    if (op <= 0.01) return;
    const it = this.item(id, g => ({ t: el('text', {}, g) }));
    it.g.setAttribute('class', 'fg ' + ink);
    it.t.setAttribute('class', cls);
    it.g.style.opacity = op;
    it.t.setAttribute('x', x); it.t.setAttribute('y', y); it.t.setAttribute('text-anchor', anchor);
    it.t.style.fontSize = (size * this.k) + 'px';
    if (it.t.textContent !== text) it.t.textContent = text;
  }
  // polyline / path in screen px
  path(id, d, { cls = 'diag', op = 1, ink = 'light', dash = null, len = null } = {}) {
    if (op <= 0.01) return;
    const it = this.item(id, g => ({ p: el('path', {}, g) }));
    it.g.setAttribute('class', 'fg ' + ink);
    it.g.style.opacity = op;
    it.p.setAttribute('class', cls);
    it.p.setAttribute('d', d);
    if (len != null) { it.p.setAttribute('pathLength', 1); it.p.style.strokeDasharray = `${len} 1`; }
    else if (dash) it.p.style.strokeDasharray = dash; else it.p.style.strokeDasharray = '';
  }
  circle(id, x, y, r, { cls = 'diag', op = 1, ink = 'light' } = {}) {
    if (op <= 0.01) return;
    const it = this.item(id, g => ({ c: el('circle', {}, g) }));
    it.g.setAttribute('class', 'fg ' + ink); it.g.style.opacity = op;
    it.c.setAttribute('class', cls); it.c.setAttribute('cx', x); it.c.setAttribute('cy', y); it.c.setAttribute('r', r);
  }
  // scale bar of `cm` centimetres at depth of point p (world), labelled
  scale(id, p, cm, txt, { op = 1, ink = 'light', at = null } = {}) {
    if (op <= 0.01) return;
    const a = this.project(p); if (!a) return;
    const right = new THREE.Vector3().setFromMatrixColumn(this.camera.matrixWorld, 0).multiplyScalar(cm).add(p);
    const b = this.project(right); if (!b) return;
    const w = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const [x, y] = at || [this.W * 0.06, this.H * (this.portrait ? 0.66 : 0.74)];
    const it = this.item(id, g => ({ bar: el('path', { class: 'bar' }, g), t: el('text', { class: 'latin' }, g) }));
    it.g.setAttribute('class', 'fg ' + ink); it.g.style.opacity = op;
    it.bar.setAttribute('d', `M${x},${y - 5} L${x},${y} L${x + w},${y} L${x + w},${y - 5}`);
    it.t.setAttribute('x', x); it.t.setAttribute('y', y + 20 * this.k); it.t.style.fontSize = (15 * this.k) + 'px';
    if (it.t.textContent !== txt) it.t.textContent = txt;
  }
  // hour stamp, top left: "05.40 · şafak"
  stamp(clock, place, op) {
    if (op <= 0.01) return;
    const k = this.k;
    const it = this.item('stamp', g => ({ c: el('text', { class: 'clock' }, g), p: el('text', { class: 'place' }, g), r: el('path', { class: 'rule' }, g) }));
    it.g.setAttribute('class', 'fg light'); it.g.style.opacity = op;
    const x = this.W * 0.045, y = this.H * 0.085 + 16 * k;
    it.c.setAttribute('x', x); it.c.setAttribute('y', y); it.c.style.fontSize = (30 * k) + 'px';
    if (it.c.textContent !== clock) it.c.textContent = clock;
    it.p.setAttribute('x', x); it.p.setAttribute('y', y + 26 * k); it.p.style.fontSize = (17 * k) + 'px';
    if (it.p.textContent !== place) it.p.textContent = place;
    it.r.setAttribute('d', `M${x},${y + 38 * k} L${x + 46 * k},${y + 38 * k}`);
  }
  // chapter title, lower left third above the subtitle band
  title(text, sub, op, { big = false, ink = 'light' } = {}) {
    if (op <= 0.01) return;
    const k = this.k * (big ? 1.9 : 1);
    const it = this.item('title', g => ({ t: el('text', { class: 'ttl' }, g), s: el('text', { class: 'latin' }, g) }));
    it.g.setAttribute('class', 'fg ' + ink); it.g.style.opacity = op;
    const x = big ? this.W / 2 : this.W * 0.045, y = big ? this.H * 0.44 : this.H * (this.portrait ? 0.6 : 0.66);
    for (const e of [it.t, it.s]) e.setAttribute('text-anchor', big ? 'middle' : 'start');
    it.t.setAttribute('x', x); it.t.setAttribute('y', y); it.t.style.fontSize = (40 * k) + 'px';
    if (it.t.textContent !== text) it.t.textContent = text;
    it.s.setAttribute('x', x); it.s.setAttribute('y', y + 30 * k); it.s.style.fontSize = (17 * k) + 'px';
    if (it.s.textContent !== sub) it.s.textContent = sub;
  }
}
