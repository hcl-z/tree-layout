import type { TidyNode } from "../node.ts";

interface AlgoState {
  w: number;
  h: number;
  y: number;
  prelim: number;
  mod: number;
  shift: number;
  change: number;
  tl: TidyNode | null;
  tr: TidyNode | null;
  el: TidyNode | null;
  er: TidyNode | null;
  msel: number;
  mser: number;
}

interface IYL {
  lowY: number;
  index: number;
  next: IYL | null;
}

const state = new WeakMap<TidyNode, AlgoState>();

function s(node: TidyNode): AlgoState {
  return state.get(node)!;
}

function initState(node: TidyNode, isHorizontal: boolean): void {
  const w = isHorizontal ? node.height : node.width;
  const h = isHorizontal ? node.width : node.height;
  state.set(node, {
    w,
    h,
    y: 0,
    prelim: 0,
    mod: 0,
    shift: 0,
    change: 0,
    tl: null,
    tr: null,
    el: null,
    er: null,
    msel: 0,
    mser: 0,
  });
}

function layer(node: TidyNode, isHorizontal: boolean, depth: number): void {
  initState(node, isHorizontal);
  s(node).y = depth;
  for (const child of node.children) {
    layer(child, isHorizontal, depth + s(node).h);
  }
}

function firstWalk(t: TidyNode): void {
  if (t.children.length === 0) {
    setExtremes(t);
    return;
  }
  firstWalk(t.children[0]!);
  let ih = updateIYL(bottom(s(t.children[0]!).el!), 0, null);
  for (let i = 1; i < t.children.length; i++) {
    firstWalk(t.children[i]!);
    const minY = bottom(s(t.children[i]!).er!);
    separate(t, i, ih);
    ih = updateIYL(minY, i, ih);
  }
  positionRoot(t);
  setExtremes(t);
}

function setExtremes(t: TidyNode): void {
  const ts = s(t);
  if (t.children.length === 0) {
    ts.el = t;
    ts.er = t;
    ts.msel = ts.mser = 0;
  } else {
    const first = s(t.children[0]!);
    const last = s(t.children[t.children.length - 1]!);
    ts.el = first.el;
    ts.msel = first.msel;
    ts.er = last.er;
    ts.mser = last.mser;
  }
}

function separate(t: TidyNode, i: number, ih: IYL | null): void {
  let sr: TidyNode | null = t.children[i - 1]!;
  let mssr = s(sr).mod;
  let cl: TidyNode | null = t.children[i]!;
  let mscl = s(cl).mod;

  while (sr !== null && cl !== null) {
    if (bottom(sr) > ih!.lowY) {
      ih = ih!.next;
    }
    const dist = mssr + s(sr).prelim + s(sr).w - (mscl + s(cl).prelim);
    if (dist > 0) {
      mscl += dist;
      moveSubtree(t, i, ih!.index, dist);
    }

    const sy = bottom(sr);
    const cy = bottom(cl);
    if (sy <= cy) {
      sr = nextRightContour(sr);
      if (sr !== null) mssr += s(sr).mod;
    }
    if (sy >= cy) {
      cl = nextLeftContour(cl);
      if (cl !== null) mscl += s(cl).mod;
    }
  }

  if (sr === null && cl !== null) {
    setLeftThread(t, i, cl, mscl);
  } else if (sr !== null && cl === null) {
    setRightThread(t, i, sr, mssr);
  }
}

function distributeExtra(t: TidyNode, i: number, si: number, dist: number): void {
  if (si !== i - 1) {
    const nr = i - si;
    s(t.children[si + 1]!).shift += dist / nr;
    s(t.children[i]!).shift -= dist / nr;
    s(t.children[i]!).change -= dist - dist / nr;
  }
}

function moveSubtree(t: TidyNode, i: number, si: number, dist: number): void {
  const cs = s(t.children[i]!);
  cs.mod += dist;
  cs.msel += dist;
  cs.mser += dist;
  distributeExtra(t, i, si, dist);
}

function nextLeftContour(t: TidyNode): TidyNode | null {
  return t.children.length === 0 ? s(t).tl : (t.children[0] ?? null);
}

function nextRightContour(t: TidyNode): TidyNode | null {
  return t.children.length === 0 ? s(t).tr : (t.children[t.children.length - 1] ?? null);
}

function bottom(t: TidyNode): number {
  return s(t).y + s(t).h;
}

function setLeftThread(t: TidyNode, i: number, cl: TidyNode, modsumcl: number): void {
  const li = s(t.children[0]!).el!;
  s(li).tl = cl;
  const diff = modsumcl - s(cl).mod - s(t.children[0]!).msel;
  s(li).mod += diff;
  s(li).prelim -= diff;
  s(t.children[0]!).el = s(t.children[i]!).el;
  s(t.children[0]!).msel = s(t.children[i]!).msel;
}

function setRightThread(t: TidyNode, i: number, sr: TidyNode, modsumsr: number): void {
  const ri = s(t.children[i]!).er!;
  s(ri).tr = sr;
  const diff = modsumsr - s(sr).mod - s(t.children[i]!).mser;
  s(ri).mod += diff;
  s(ri).prelim -= diff;
  s(t.children[i]!).er = s(t.children[i - 1]!).er;
  s(t.children[i]!).mser = s(t.children[i - 1]!).mser;
}

function positionRoot(t: TidyNode): void {
  const first = t.children[0]!;
  const last = t.children[t.children.length - 1]!;
  s(t).prelim =
    (s(first).prelim + s(first).mod + s(last).mod + s(last).prelim + s(last).w) / 2 - s(t).w / 2;
}

function addChildSpacing(t: TidyNode): void {
  let d = 0;
  let modsumdelta = 0;
  for (const child of t.children) {
    const cs = s(child);
    d += cs.shift;
    modsumdelta += d + cs.change;
    cs.mod += modsumdelta;
  }
}

function secondWalk(t: TidyNode, modsum: number, isHorizontal: boolean): void {
  modsum += s(t).mod;
  if (isHorizontal) {
    t.x = s(t).y;
    t.y = s(t).prelim + modsum;
  } else {
    t.x = s(t).prelim + modsum;
    t.y = s(t).y;
  }
  addChildSpacing(t);
  for (const child of t.children) {
    secondWalk(child, modsum, isHorizontal);
  }
}

function updateIYL(lowY: number, index: number, ih: IYL | null): IYL {
  let current = ih;
  while (current !== null && lowY >= current.lowY) {
    current = current.next;
  }
  return { lowY, index, next: current };
}

function normalize(root: TidyNode): void {
  let minX = Infinity;
  let minY = Infinity;
  root.eachNode((n) => {
    minX = Math.min(minX, n.x);
    minY = Math.min(minY, n.y);
  });
  root.eachNode((n) => {
    n.x -= minX;
    n.y -= minY;
  });
}

export function nonLayeredTidyTree(root: TidyNode, isHorizontal: boolean): TidyNode {
  layer(root, isHorizontal, 0);
  firstWalk(root);
  secondWalk(root, 0, isHorizontal);
  normalize(root);
  return root;
}
