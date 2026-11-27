// Three.js background: stars, dust, motes, shooting stars, shader terrain with a sun glow,
// and one wireframe object per section that cross-fades as you scroll.
// Loaded with a dynamic import after the loader, on idle. Ported from the r128 original.
import {
  AdditiveBlending,
  BoxGeometry,
  BufferAttribute,
  BufferGeometry,
  CanvasTexture,
  ColorManagement,
  CylinderGeometry,
  DodecahedronGeometry,
  EdgesGeometry,
  ExtrudeGeometry,
  Float32BufferAttribute,
  Group,
  IcosahedronGeometry,
  Line,
  LineBasicMaterial,
  LineLoop,
  LineSegments,
  LinearSRGBColorSpace,
  Material,
  Mesh,
  MeshBasicMaterial,
  Object3D,
  OctahedronGeometry,
  Path,
  PerspectiveCamera,
  PlaneGeometry,
  Points,
  PointsMaterial,
  Scene,
  ShaderMaterial,
  Shape,
  SphereGeometry,
  TetrahedronGeometry,
  TorusGeometry,
  TorusKnotGeometry,
  Vector3,
  WebGLRenderer,
  WireframeGeometry,
} from "three";
import { reduceMotion } from "./lib/env";
import { sectionAt } from "./lib/sections";

// Match the r128 look: no sRGB output conversion or colour management.
ColorManagement.enabled = false;

const PROJECTS = 7; // section index whose object stays faintly visible

type Weighted = [Material & { opacity?: number; uniforms?: Record<string, { value: number }> }, number];
interface SectionObject {
  g: Group;
  m: Weighted[];
  i: number;
  side: number;
  sc: number;
  halos?: Points[];
}

/** Gives the main thread back between build steps so no single task blocks input for long. */
const yieldToMain = () =>
  new Promise<void>((r) => {
    const sch = (globalThis as { scheduler?: { yield?: () => Promise<void> } }).scheduler;
    if (sch?.yield) sch.yield().then(r);
    else setTimeout(r, 0);
  });

export async function init() {
  const cv = document.getElementById("c") as HTMLCanvasElement | null;
  if (!cv) return;
  let R: WebGLRenderer;
  try {
    R = new WebGLRenderer({ canvas: cv, antialias: true });
  } catch {
    return; // no WebGL: the page is complete without the background
  }
  // Fewer particles on low-end devices and small screens; geometry stays the same.
  const lite = (navigator.hardwareConcurrency || 8) <= 4 || innerWidth < 900;
  const q = (nn: number) => Math.round(lite ? nn * 0.5 : nn);

  const PR = Math.min(devicePixelRatio || 1, innerWidth < 900 ? 1.5 : 2);
  R.setPixelRatio(PR);
  R.setClearColor(0x222222, 1);
  R.outputColorSpace = LinearSRGBColorSpace;
  const sc = new Scene();
  const cam = new PerspectiveCamera(50, 1, 0.1, 200);

  const LM = (o: number) => new LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: o });
  const PM = (s: number, o: number) =>
    new PointsMaterial({ color: 0xffffff, size: s, transparent: true, opacity: o, depthWrite: false });
  const V3 = (x: number, y: number, z: number) => new Vector3(x, y, z);
  const BG = (a: number[]) => {
    const g = new BufferGeometry();
    g.setAttribute("position", new Float32BufferAttribute(a, 3));
    return g;
  };
  function circ(r: number, seg: number, m: Material) {
    const p: number[] = [];
    for (let i = 0; i < seg; i++) {
      const a = (i / seg) * 6.2832;
      p.push(Math.cos(a) * r, Math.sin(a) * r, 0);
    }
    return new LineLoop(BG(p), m);
  }
  const NZ =
    "float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}float nz(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}float fbm(vec2 p){float a=.5,s=0.;for(int i=0;i<4;i++){s+=a*nz(p);p*=2.03;a*=.5;}return s;}";

  await yieldToMain();
  // ---------- stars, dust, motes, shooting stars ----------
  const SN = q(1900);
  const sp = new Float32Array(SN * 3);
  const ss = new Float32Array(SN);
  const sph = new Float32Array(SN);
  for (let i = 0; i < SN; i++) {
    sp[i * 3] = (Math.random() - 0.5) * 60;
    sp[i * 3 + 1] = (Math.random() - 0.5) * 36;
    sp[i * 3 + 2] = -Math.random() * 40 + 8;
    ss[i] = 0.6 + Math.random() * 1.9;
    sph[i] = Math.random() * 6.28;
  }
  const sg = new BufferGeometry();
  sg.setAttribute("position", new BufferAttribute(sp, 3));
  sg.setAttribute("sz", new BufferAttribute(ss, 1));
  sg.setAttribute("ph", new BufferAttribute(sph, 1));
  const starM = new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: { uT: { value: 0 }, uPR: { value: PR } },
    vertexShader:
      "attribute float sz,ph;uniform float uT,uPR;varying float vA;void main(){vA=.45+.55*sin(uT*1.4+ph);gl_PointSize=sz*uPR*1.5;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}",
    fragmentShader:
      "varying float vA;void main(){float d=length(gl_PointCoord-.5);if(d>.5)discard;gl_FragColor=vec4(1.,1.,1.,vA*(1.-d*1.6));}",
  });
  const stars = new Points(sg, starM);
  sc.add(stars);

  await yieldToMain();
  const DN = q(260);
  const dp = new Float32Array(DN * 3);
  const dv: number[] = [];
  for (let i = 0; i < DN; i++) {
    dp[i * 3] = (Math.random() - 0.5) * 26;
    dp[i * 3 + 1] = (Math.random() - 0.5) * 16;
    dp[i * 3 + 2] = (Math.random() - 0.5) * 10;
    dv.push(0.003 + Math.random() * 0.01);
  }
  const dg = new BufferGeometry();
  dg.setAttribute("position", new BufferAttribute(dp, 3));
  sc.add(new Points(dg, PM(0.045, 0.75)));

  await yieldToMain();
  const MN = q(3200);
  const MP = new Float32Array(MN * 3);
  const MCOL = new Float32Array(MN * 3);
  const PAL = [1, 0.9, 0.75, 0.58, 0.42, 0.26, 0.1, 0.03];
  for (let i = 0; i < MN; i++) {
    MP[i * 3] = (Math.random() - 0.5) * 50;
    MP[i * 3 + 1] = (Math.random() - 0.5) * 30;
    MP[i * 3 + 2] = -Math.random() * 30 + 6;
    const gv = PAL[Math.floor(Math.random() * PAL.length)];
    MCOL[i * 3] = MCOL[i * 3 + 1] = MCOL[i * 3 + 2] = gv;
  }
  const MG = new BufferGeometry();
  MG.setAttribute("position", new BufferAttribute(MP, 3));
  MG.setAttribute("color", new BufferAttribute(MCOL, 3));
  const MOT = new Points(
    MG,
    new PointsMaterial({ size: 0.075, vertexColors: true, transparent: true, opacity: 0.9, depthWrite: false }),
  );
  sc.add(MOT);

  const shoots: { m: Mesh<PlaneGeometry, MeshBasicMaterial>; t: number }[] = [];
  for (let i = 0; i < 3; i++) {
    const m = new Mesh(
      new PlaneGeometry(2.4, 0.02),
      new MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, depthWrite: false }),
    );
    m.rotation.z = -0.5;
    sc.add(m);
    shoots.push({ m, t: -Math.random() * 6 - i * 2 });
  }

  await yieldToMain();
  // ---------- terrain + sun ----------
  const tg = new PlaneGeometry(48, 32, 150, 84);
  tg.rotateX(-Math.PI / 2);
  const TV =
    NZ +
    "uniform float uT;varying float vH;void main(){vec3 p=position;float ridge=exp(-p.x*p.x*.012);float f=fbm(vec2(p.x*.2,p.z*.2-uT*.07));float hg=(f-.3)*(1.4+5.2*ridge)*(1.-smoothstep(0.,13.,p.z));hg=max(hg,-.5);p.y=hg;vH=hg;gl_PointSize=2.6;gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);}";
  const terrW = new ShaderMaterial({
    wireframe: true,
    transparent: true,
    depthWrite: false,
    uniforms: { uT: { value: 0 }, uOp: { value: 1 } },
    vertexShader: TV,
    fragmentShader:
      "uniform float uOp;varying float vH;void main(){float b=.3+.7*smoothstep(-.4,3.4,vH);gl_FragColor=vec4(vec3(1.),b*uOp*.62);}",
  });
  const terrP = new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: { uT: terrW.uniforms.uT, uOp: terrW.uniforms.uOp },
    vertexShader: TV,
    fragmentShader:
      "uniform float uOp;varying float vH;void main(){float d=length(gl_PointCoord-.5);if(d>.5)discard;gl_FragColor=vec4(vec3(1.),(.4+.6*smoothstep(-.4,3.4,vH))*uOp);}",
  });
  const terrain = new Group();
  terrain.add(new Mesh(tg, terrW), new Points(tg, terrP));
  terrain.position.set(0, -3.9, -3);
  sc.add(terrain);
  const gc = document.createElement("canvas");
  gc.width = gc.height = 256;
  const gx = gc.getContext("2d")!;
  const gr = gx.createRadialGradient(128, 128, 0, 128, 128, 128);
  gr.addColorStop(0, "rgba(255,255,255,1)");
  gr.addColorStop(0.12, "rgba(255,255,255,.7)");
  gr.addColorStop(0.4, "rgba(255,255,255,.14)");
  gr.addColorStop(1, "rgba(255,255,255,0)");
  gx.fillStyle = gr;
  gx.fillRect(0, 0, 256, 256);
  const sunM = new MeshBasicMaterial({
    map: new CanvasTexture(gc),
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
  });
  const sun = new Mesh(new PlaneGeometry(10, 10), sunM);
  sun.position.set(0, 3.3, -14);
  sc.add(sun);

  await yieldToMain();
  // ---------- per-section objects: each fades with its own weight ----------
  const OBJ: SectionObject[] = [];
  function mk(sec: number, side: number, scl = 1): SectionObject {
    const o: SectionObject = { g: new Group(), m: [], i: sec, side, sc: scl };
    sc.add(o.g);
    OBJ.push(o);
    return o;
  }
  function M<T extends Material>(o: SectionObject, mat: T, b: number): T {
    o.m.push([mat as Weighted[0], b]);
    return mat;
  }
  function halo(o: SectionObject, r: number, cnt: number, tilt: number) {
    const p: number[] = [];
    for (let i = 0; i < q(cnt); i++) {
      const a = Math.random() * 6.2832;
      const rr = r * (1 + (Math.random() - 0.5) * 0.14);
      p.push(Math.cos(a) * rr, (Math.random() - 0.5) * 0.25, Math.sin(a) * rr);
    }
    const h = new Points(BG(p), M(o, PM(0.035, 0.85), 0.85));
    h.rotation.x = tilt;
    o.g.add(h);
    (o.halos = o.halos || []).push(h);
  }
  function gear(Rr: number, teeth: number, tooth: number, depth: number, hole: number, mat: Material) {
    const s = new Shape();
    const st = (Math.PI * 2) / teeth;
    const Ri = Rr - tooth;
    const pat = [
      [Ri, 0],
      [Ri, 0.12],
      [Rr, 0.28],
      [Rr, 0.5],
      [Ri, 0.66],
      [Ri, 1],
    ];
    for (let t = 0; t < teeth; t++)
      pat.forEach((pt, k) => {
        const a = t * st + pt[1] * st;
        const x = Math.cos(a) * pt[0];
        const y = Math.sin(a) * pt[0];
        if (t === 0 && k === 0) s.moveTo(x, y);
        else s.lineTo(x, y);
      });
    const h = new Path();
    h.absarc(0, 0, Rr * hole, 0, Math.PI * 2, true);
    s.holes.push(h);
    return new LineSegments(new EdgesGeometry(new ExtrudeGeometry(s, { depth, bevelEnabled: false }), 15), mat);
  }
  function gearSet(o: SectionObject) {
    const m = M(o, LM(0.95), 0.95);
    const g = new Group();
    const a = gear(1.7, 26, 0.22, 0.3, 0.55, m);
    const b = gear(1, 15, 0.2, 0.3, 0.45, m);
    const c = gear(0.62, 9, 0.16, 0.3, 0.4, m);
    a.position.set(0.3, 0.2, 0);
    b.position.set(-1.95, -1.55, 0);
    c.position.set(-2.4, -0.1, 0);
    g.add(a, b, c);
    return { g, a, b, c };
  }

  // hero: orbital rings around the sun
  const hero = mk(0, 0, 1);
  hero.g.position.set(0, 1.5, -8);
  halo(hero, 3.4, 520, 0.35);
  halo(hero, 4.6, 620, -0.5);
  halo(hero, 6, 760, 1.1);
  hero.g.add(new LineSegments(new WireframeGeometry(new IcosahedronGeometry(1.6, 1)), M(hero, LM(0.5), 0.5)));

  await yieldToMain();
  // about: brain + gears (left)
  const bn = (x: number, y: number, z: number) =>
    Math.sin(x * 1.9 + 1.3) * Math.cos(y * 2.3 - 0.7) +
    Math.sin(z * 2.1 + 2.1) * Math.cos(x * 1.7 + y * 1.1) * 0.6 +
    Math.sin((x + y + z) * 3.1) * 0.25;
  const ab = mk(1, -1);
  const ig = new IcosahedronGeometry(2.2, 3);
  const ip = ig.attributes.position;
  for (let i = 0; i < ip.count; i++) {
    const x = ip.getX(i);
    const y = ip.getY(i);
    const z = ip.getZ(i);
    let f = 1 + 0.1 * bn(x, y, z);
    f *= 1 - 0.1 * Math.exp(-x * x * 5) * (y > -0.3 ? 1 : 0.3);
    ip.setXYZ(i, x * f * 1.12, y * f * 0.88, z * f * 1.2);
  }
  const brain = new Group();
  brain.add(new LineSegments(new WireframeGeometry(ig), M(ab, LM(0.6), 0.6)), new Points(ig, M(ab, PM(0.05, 0.9), 0.9)));
  const inner: number[] = [];
  for (let i = 0; i < q(1300); i++) {
    const a = Math.random() * 6.28;
    const b = Math.acos(2 * Math.random() - 1);
    const r = Math.pow(Math.random(), 0.5) * 2;
    inner.push(Math.sin(b) * Math.cos(a) * r * 1.1, Math.cos(b) * r * 0.85, Math.sin(b) * Math.sin(a) * r * 1.15);
  }
  brain.add(new Points(BG(inner), M(ab, PM(0.03, 0.7), 0.7)));
  const gA = gearSet(ab);
  gA.g.position.z = 1.9;
  ab.g.add(brain, gA.g);
  halo(ab, 3.6, 420, 0.5);

  await yieldToMain();
  // education: armillary (right)
  const ar = mk(2, 1);
  const armM = M(ar, LM(0.9), 0.9);
  [
    [0, 0, 0],
    [1.5708, 0, 0],
    [0, 1.5708, 0],
    [0.9, 0.5, 0],
  ].forEach((r, i) => {
    const c = circ(i === 3 ? 2.45 : 2.1, 120, armM);
    c.rotation.set(r[0], r[1], r[2]);
    ar.g.add(c);
  });
  ar.g.add(new LineSegments(new WireframeGeometry(new SphereGeometry(1.45, 16, 11)), M(ar, LM(0.3), 0.3)));
  ar.g.add(new Line(BG([0, -2.9, 0, 0, 2.9, 0]), armM));
  const orb = new Points(BG([2.1, 0, 0, -2.1, 0, 0, 0, 2.1, 0]), M(ar, PM(0.12, 0.95), 0.95));
  ar.g.add(orb);
  halo(ar, 3.3, 380, 0.9);

  await yieldToMain();
  // skills: neural net with travelling pulses (left)
  const nn = mk(3, -1, 1.2);
  const edges: [Vector3, Vector3][] = [];
  const ep: number[] = [];
  const allN: number[] = [];
  const layers = [4, 7, 7, 4].map((c, l) => {
    const L: Vector3[] = [];
    for (let k = 0; k < c; k++) {
      const p = V3((l - 1.5) * 1.9, (k - (c - 1) / 2) * (4.4 / Math.max(c - 1, 1)), (Math.random() - 0.5) * 1.2);
      L.push(p);
      allN.push(p.x, p.y, p.z);
    }
    return L;
  });
  for (let l = 0; l < 3; l++)
    layers[l].forEach((a) =>
      layers[l + 1].forEach((b) => {
        edges.push([a, b]);
        ep.push(a.x, a.y, a.z, b.x, b.y, b.z);
      }),
    );
  nn.g.add(new LineSegments(BG(ep), M(nn, LM(0.32), 0.32)), new Points(BG(allN), M(nn, PM(0.16, 1), 1)));
  const PN = 34;
  const pulses: { e: number; t: number; s: number }[] = [];
  const pa = new Float32Array(PN * 3);
  for (let i = 0; i < PN; i++)
    pulses.push({ e: Math.floor(Math.random() * edges.length), t: Math.random(), s: 0.006 + Math.random() * 0.012 });
  const pg2 = new BufferGeometry();
  pg2.setAttribute("position", new BufferAttribute(pa, 3));
  nn.g.add(new Points(pg2, M(nn, PM(0.2, 1), 1)));

  await yieldToMain();
  // credentials: torus knot + inner knot (right)
  const kn = mk(4, 1);
  const kgm = new TorusKnotGeometry(1.6, 0.4, 150, 14, 2, 3);
  kn.g.add(new LineSegments(new WireframeGeometry(kgm), M(kn, LM(0.4), 0.4)), new Points(kgm, M(kn, PM(0.035, 0.9), 0.9)));
  const kn2 = new LineSegments(new WireframeGeometry(new TorusKnotGeometry(0.9, 0.12, 100, 8, 3, 2)), M(kn, LM(0.5), 0.5));
  kn.g.add(kn2);
  halo(kn, 3.2, 360, 0.2);

  await yieldToMain();
  // experience: gears (right)
  const ex = mk(5, 1, 1.15);
  const gB = gearSet(ex);
  ex.g.add(gB.g);
  halo(ex, 3.6, 360, 0.7);

  await yieldToMain();
  // research: DNA helix (left)
  const rs = mk(6, -1);
  const HN = 100;
  const sa: Vector3[] = [];
  const sb2: Vector3[] = [];
  const rungs: number[] = [];
  for (let i = 0; i < HN; i++) {
    const y = (i / (HN - 1) - 0.5) * 7.4;
    const a = i * 0.24;
    const A = V3(Math.cos(a) * 1.15, y, Math.sin(a) * 1.15);
    const B = V3(Math.cos(a + Math.PI) * 1.15, y, Math.sin(a + Math.PI) * 1.15);
    sa.push(A);
    sb2.push(B);
    if (i % 3 === 0) rungs.push(A.x, A.y, A.z, B.x, B.y, B.z);
  }
  const strip = (arr: Vector3[]) => {
    const p: number[] = [];
    for (let i = 0; i < arr.length - 1; i++) p.push(arr[i].x, arr[i].y, arr[i].z, arr[i + 1].x, arr[i + 1].y, arr[i + 1].z);
    return BG(p);
  };
  const hl = M(rs, LM(0.55), 0.55);
  rs.g.add(new LineSegments(strip(sa), hl), new LineSegments(strip(sb2), hl), new LineSegments(BG(rungs), M(rs, LM(0.3), 0.3)));
  const hp: number[] = [];
  sa.concat(sb2).forEach((v) => hp.push(v.x, v.y, v.z));
  rs.g.add(new Points(BG(hp), M(rs, PM(0.07, 1), 1)));
  halo(rs, 2.4, 260, Math.PI / 2);

  await yieldToMain();
  // projects: floating polyhedra
  const pj = mk(PROJECTS, 0);
  const polyM = M(pj, LM(0.8), 0.8);
  const polys: LineSegments[] = [];
  (
    [
      [new IcosahedronGeometry(1.3, 0), -7.4, 3.2, -2],
      [new DodecahedronGeometry(1.5, 0), 6.8, 3.4, -2],
      [new OctahedronGeometry(1.2, 0), -6, -3.2, -1],
      [new TetrahedronGeometry(1.2, 0), 7.4, -2.6, -1.5],
      [new IcosahedronGeometry(0.8, 0), 0.6, 4.4, -3],
      [new BoxGeometry(1.4, 1.4, 1.4), -0.2, -4.4, -2],
      [new TorusGeometry(0.9, 0.25, 8, 20), -3.6, 4.6, -4],
      [new OctahedronGeometry(0.7, 0), 4, -4.4, -3],
    ] as [BufferGeometry, number, number, number][]
  ).forEach((d, i) => {
    const m = new LineSegments(new EdgesGeometry(d[0]), polyM);
    m.position.set(d[1], d[2], d[3]);
    m.userData = { bx: d[1], by: d[2], ph: i * 1.7 };
    pj.g.add(m);
    polys.push(m);
    d[0].dispose();
  });

  await yieldToMain();
  // awards: medal (right)
  const md = mk(8, 1);
  const mdM = M(md, LM(0.9), 0.9);
  md.g.add(new LineSegments(new EdgesGeometry(new CylinderGeometry(1.6, 1.6, 0.24, 48), 5), mdM));
  const r2 = circ(1.25, 80, M(md, LM(0.45), 0.45));
  r2.position.z = 0.14;
  md.g.add(r2);
  const star = new Shape();
  for (let i = 0; i < 10; i++) {
    const rr = i % 2 ? 0.45 : 1;
    const aa = (i / 10) * 6.2832 + Math.PI / 2;
    if (i) star.lineTo(Math.cos(aa) * rr, Math.sin(aa) * rr);
    else star.moveTo(Math.cos(aa) * rr, Math.sin(aa) * rr);
  }
  const stM = new LineSegments(new EdgesGeometry(new ExtrudeGeometry(star, { depth: 0.1, bevelEnabled: false })), mdM);
  stM.position.z = 0.14;
  stM.scale.setScalar(0.9);
  md.g.add(stM);
  [-1, 1].forEach((sd) => {
    const rb = new LineSegments(new EdgesGeometry(new PlaneGeometry(0.7, 2.4)), mdM);
    rb.position.set(sd * 0.5, 2.1, -0.05);
    rb.rotation.z = -sd * 0.28;
    md.g.add(rb);
  });
  halo(md, 2.8, 320, 1.3);

  await yieldToMain();
  // contact: living particle blob (right)
  const bo = mk(9, 1);
  const BN = q(5400);
  const bp = new Float32Array(BN * 3);
  const bs = new Float32Array(BN);
  for (let i = 0; i < BN; i++) {
    const yy = 1 - (i / (BN - 1)) * 2;
    const rr2 = Math.sqrt(1 - yy * yy);
    const th = i * 2.399963;
    bp[i * 3] = Math.cos(th) * rr2;
    bp[i * 3 + 1] = yy;
    bp[i * 3 + 2] = Math.sin(th) * rr2;
    bs[i] = Math.random();
  }
  const bgm = new BufferGeometry();
  bgm.setAttribute("position", new BufferAttribute(bp, 3));
  bgm.setAttribute("r", new BufferAttribute(bs, 1));
  const blobM = new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: { uT: { value: 0 }, uOp: { value: 0 }, uPR: { value: PR } },
    vertexShader:
      "attribute float r;uniform float uT,uPR;varying float vA;void main(){vec3 p=position;float d=sin(p.x*2.3+uT*.6)*cos(p.y*2.1-uT*.5)*.5+sin(p.z*3.+uT*.4)*.3+sin((p.x+p.y)*4.+uT*.8)*.12;float R=2.7*(1.+d*.28)*(r>.82?.6:1.);vA=.5+.5*r;gl_PointSize=1.9*uPR;gl_Position=projectionMatrix*modelViewMatrix*vec4(p*R,1.);}",
    fragmentShader:
      "uniform float uOp;varying float vA;void main(){float d=length(gl_PointCoord-.5);if(d>.5)discard;gl_FragColor=vec4(vec3(1.),vA*uOp);}",
  });
  bo.g.add(new Points(bgm, M(bo, blobM, 0.5)));
  halo(bo, 3.9, 420, 0.6);

  // ---------- loop ----------
  let mob = false;
  function resize() {
    const w = innerWidth;
    const h = innerHeight;
    R.setSize(w, h, false);
    cam.aspect = w / h;
    mob = w < 900;
    cam.position.z = mob ? 16.5 : 12.4;
    cam.updateProjectionMatrix();
    dirty = true;
  }

  let mx = 0;
  let my = 0;
  let tmx = 0;
  let tmy = 0;
  let sIdx = sectionAt().progress;
  let vel = 0;
  let lastY = scrollY;
  let dirty = true; // reduced motion renders only when something changed
  const onPointer = (e: PointerEvent) => {
    tmx = (e.clientX / innerWidth - 0.5) * 2;
    tmy = (e.clientY / innerHeight - 0.5) * 2;
    dirty = true;
  };
  const onScroll = () => (dirty = true);
  addEventListener("resize", resize, { passive: true });
  addEventListener("pointermove", onPointer, { passive: true });
  addEventListener("scroll", onScroll, { passive: true });
  resize();

  const sm = (a: number, b: number, x: number) => {
    x = Math.max(0, Math.min(1, (x - a) / (b - a)));
    return x * x * (3 - 2 * x);
  };
  const wt = (i: number, s: number) => {
    if (i === 0) return 1 - sm(0.1, 0.95, s);
    const w = sm(i - 0.12, i + 0.12, s) * (1 - sm(i + 0.88, i + 1.12, s));
    return i === PROJECTS ? Math.max(mob ? 0.12 : 0.28, w) : w;
  };

  // Compile every shader before the first frame, without blocking (parallel compile where supported).
  await yieldToMain();
  await R.compileAsync(sc, cam);
  await yieldToMain();

  const t0 = performance.now();
  let raf = 0;
  let paused = false;
  let shown = false;

  function frame(now: number) {
    raf = requestAnimationFrame(frame);
    if (paused) return;
    const settled =
      Math.abs(tmx - mx) + Math.abs(tmy - my) < 0.001 && Math.abs(sectionAt().progress - sIdx) < 0.001 && vel < 0.001;
    if (reduceMotion && !dirty && settled) return;
    dirty = false;
    const t = reduceMotion ? 0 : (now - t0) / 1000;
    mx += (tmx - mx) * 0.05;
    my += (tmy - my) * 0.05;
    vel += (Math.abs(scrollY - lastY) * 0.03 - vel) * 0.1;
    lastY = scrollY;
    sIdx += (sectionAt().progress - sIdx) * 0.1;
    const s = sIdx;
    const wT = wt(0, s);
    const K = mob ? 0.45 : 1;
    starM.uniforms.uT.value = t;
    terrW.uniforms.uT.value = t;
    blobM.uniforms.uT.value = t;
    stars.rotation.y = t * 0.01 + s * 0.1;
    stars.position.x = -mx * 0.5;
    stars.position.y = my * 0.3;
    MOT.rotation.y = t * 0.015 + s * 0.06;
    MOT.position.x = -mx * 0.4;
    MOT.position.y = my * 0.25 + Math.sin(t * 0.2) * 0.2;
    if (!reduceMotion) {
      const dpa = dg.attributes.position.array as Float32Array;
      for (let d = 0; d < DN; d++) {
        dpa[d * 3 + 1] += dv[d];
        dpa[d * 3] += Math.sin(t + d) * 0.0012;
        if (dpa[d * 3 + 1] > 8) dpa[d * 3 + 1] = -8;
      }
      dg.attributes.position.needsUpdate = true;
      for (const sh of shoots) {
        sh.t += 0.016;
        if (sh.t > 0 && sh.t < 1.1) {
          const kk = sh.t / 1.1;
          sh.m.position.set(-10 + kk * 14, 6 - kk * 5, -6);
          sh.m.material.opacity = Math.sin(kk * Math.PI) * 0.95;
        } else {
          sh.m.material.opacity = 0;
          if (sh.t > 1.1) sh.t = -(4 + Math.random() * 7);
        }
      }
    }
    terrW.uniforms.uOp.value = wT;
    terrain.visible = sun.visible = wT > 0.01;
    terrain.rotation.y = mx * 0.05;
    terrain.position.y = -3.9 - s * 0.5;
    sunM.opacity = wT * (0.85 + 0.15 * Math.sin(t * 1.2));
    sun.position.x = mx * 0.8;
    for (const o of OBJ) {
      const w = wt(o.i, s);
      o.g.visible = w > 0.01;
      if (!o.g.visible) continue;
      for (const [mat, base] of o.m) {
        if (mat.uniforms) mat.uniforms.uOp.value = base * w * (mob ? 0.45 : 1);
        else mat.opacity = base * w * (o.i === 0 ? 1 : K);
      }
      if (o.i > 0 && o.i !== PROJECTS) {
        const bx = o.i === 9 ? 0 : o.side * 5.1;
        o.g.position.set(mob ? 0 : bx + mx * 0.25, (mob ? 3.4 : 0) + Math.sin(t * 0.6 + o.side) * 0.12 - my * 0.15, 0);
        o.g.scale.setScalar((mob ? 0.5 : 1) * o.sc);
      }
      o.halos?.forEach((h, k) => (h.rotation.y = t * (0.12 + k * 0.05) * (k % 2 ? -1 : 1) + s * 0.3));
    }
    hero.g.rotation.y = t * 0.1 + mx * 0.2;
    const ws = 0.6 + vel * 2.5;
    ab.g.rotation.y = -0.5 + Math.sin(t * 0.3) * 0.2 + mx * 0.4 + s * 0.4;
    brain.rotation.y = t * 0.12;
    gA.a.rotation.z = (t * 5 * ws) / 26;
    gA.b.rotation.z = (-t * 5 * ws) / 15;
    gA.c.rotation.z = (t * 5 * ws) / 9;
    ar.g.rotation.set(0.35 + my * 0.2, t * 0.18 + mx * 0.4, 0.2);
    orb.rotation.y = t * 0.8;
    nn.g.rotation.y = Math.sin(t * 0.3) * 0.5 + mx * 0.4;
    nn.g.rotation.x = my * 0.2;
    if (wt(3, s) > 0.01) {
      const pp = pg2.attributes.position.array as Float32Array;
      pulses.forEach((p, k) => {
        p.t += p.s * (1 + vel * 4);
        if (p.t > 1) {
          p.t = 0;
          p.e = Math.floor(Math.random() * edges.length);
        }
        const e = edges[p.e];
        pp[k * 3] = e[0].x + (e[1].x - e[0].x) * p.t;
        pp[k * 3 + 1] = e[0].y + (e[1].y - e[0].y) * p.t;
        pp[k * 3 + 2] = e[0].z + (e[1].z - e[0].z) * p.t;
      });
      pg2.attributes.position.needsUpdate = true;
    }
    kn.g.rotation.set(t * 0.15 + my * 0.3, t * 0.22 + mx * 0.4, 0);
    kn2.rotation.y = -t * 0.5;
    ex.g.rotation.y = -0.3 + mx * 0.4;
    ex.g.rotation.x = my * 0.2;
    gB.a.rotation.z = (t * 5 * ws) / 26;
    gB.b.rotation.z = (-t * 5 * ws) / 15;
    gB.c.rotation.z = (t * 5 * ws) / 9;
    rs.g.rotation.y = t * 0.35 + s * 0.4 + mx * 0.3;
    rs.g.rotation.z = 0.12;
    for (const p of polys) {
      const u = p.userData as { bx: number; by: number; ph: number };
      p.rotation.x = t * 0.2 + u.ph;
      p.rotation.y = t * 0.28 + u.ph;
      p.position.set(
        u.bx * (mob ? 0.45 : 1) + Math.sin(t * 0.4 + u.ph) * 0.4 + mx * 0.3 * (u.ph + 1) * 0.3,
        u.by * (mob ? 0.7 : 1) + Math.cos(t * 0.5 + u.ph) * 0.35 - s * 0.2,
        p.position.z,
      );
    }
    md.g.rotation.y = Math.sin(t * 0.6) * 0.6 + mx * 0.4;
    md.g.rotation.x = -0.1 + my * 0.15;
    bo.g.rotation.y = t * 0.12 + mx * 0.3;
    bo.g.rotation.x = my * 0.2;

    // Credentials knot: centre it in the open space right of the panel on wide screens.
    if (innerWidth >= 900 && kn.g.visible) {
      const W = innerWidth;
      const cx = (Math.min(W * 0.06 + 880, W * 0.94) + W) / 2;
      const hw = Math.tan((25 * Math.PI) / 180) * 12.4 * (W / innerHeight);
      const wx = Math.min(((cx - W / 2) / (W / 2)) * hw, hw - 3.8);
      kn.g.position.x += wx - 5.1;
    }
    // While Projects is on screen, show only every other polyhedron.
    const pjOn = document.body.classList.contains("pj");
    polys.forEach((m, i) => (m.visible = !pjOn || i % 2 === 0));

    cam.position.x = mx * 0.6;
    cam.position.y = 0.4 - my * 0.35 - s * 0.08;
    cam.lookAt(0, -0.6, 0);
    R.render(sc, cam);
    if (!shown) {
      shown = true;
      cv!.classList.add("on");
    }
  }
  raf = requestAnimationFrame(frame);

  // Pause when nobody can see it: hidden tab, or a project modal covering the canvas.
  const onVisibility = () => {
    paused = document.hidden;
    dirty = true;
  };
  const onModalOpen = () => (paused = true);
  const onModalClose = () => {
    paused = document.hidden;
    dirty = true;
  };
  document.addEventListener("visibilitychange", onVisibility);
  addEventListener("modal:open", onModalOpen);
  addEventListener("modal:close", onModalClose);

  function destroy() {
    cancelAnimationFrame(raf);
    removeEventListener("resize", resize);
    removeEventListener("pointermove", onPointer);
    removeEventListener("scroll", onScroll);
    document.removeEventListener("visibilitychange", onVisibility);
    removeEventListener("modal:open", onModalOpen);
    removeEventListener("modal:close", onModalClose);
    sc.traverse((o: Object3D) => {
      const obj = o as Object3D & { geometry?: BufferGeometry; material?: Material | Material[] };
      obj.geometry?.dispose();
      const mats = Array.isArray(obj.material) ? obj.material : obj.material ? [obj.material] : [];
      for (const m of mats) {
        (m as MeshBasicMaterial).map?.dispose();
        m.dispose();
      }
    });
    tg.dispose();
    ig.dispose();
    kgm.dispose();
    R.dispose();
  }
  cv.addEventListener("webglcontextlost", destroy, { once: true });
  addEventListener("pagehide", (e) => !e.persisted && destroy(), { once: true });
  return destroy;
}
