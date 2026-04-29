import { createTree, layout, getNodes, getBoundingBox } from "tree-layout";
import type { TidyNode } from "tree-layout";
import { generateTree } from "./sample-data.ts";
import { Renderer } from "./renderer.ts";

type LayoutName = keyof typeof layout;

const HORIZONTAL_LAYOUTS = new Set<string>(["rightLogical", "leftLogical", "standard"]);

const canvas = document.getElementById("canvas") as HTMLCanvasElement;
const layoutSelect = document.getElementById("layout-select") as HTMLSelectElement;
const nodeSlider = document.getElementById("node-slider") as HTMLInputElement;
const nodeCountDisplay = document.getElementById("node-count-display") as HTMLSpanElement;
const hgapSlider = document.getElementById("hgap-slider") as HTMLInputElement;
const hgapDisplay = document.getElementById("hgap-display") as HTMLSpanElement;
const vgapSlider = document.getElementById("vgap-slider") as HTMLInputElement;
const vgapDisplay = document.getElementById("vgap-display") as HTMLSpanElement;
const statsEl = document.getElementById("stats") as HTMLDivElement;
const renderer = new Renderer(canvas);

let currentLayout: LayoutName = "downward";
let nodeCount = 50;
let hgap = 14;
let vgap = 14;
let root: TidyNode | null = null;

function regenerateAndLayout(fitView = false): void {
  const data = generateTree(nodeCount);
  const t0 = performance.now();
  root = createTree(data, {
    getHGap: () => hgap,
    getVGap: () => vgap,
  });
  layout[currentLayout](root);
  const elapsed = performance.now() - t0;

  const nodes = getNodes(root);
  const bb = getBoundingBox(root);
  statsEl.innerHTML = [
    `Nodes: ${nodes.length}`,
    `Time: ${elapsed.toFixed(2)}ms`,
    `Size: ${bb.width.toFixed(0)} × ${bb.height.toFixed(0)}`,
  ].join("<br>");

  renderer.setRoot(root, HORIZONTAL_LAYOUTS.has(currentLayout));
  if (fitView) renderer.fitToView();
}

function relayoutCurrent(fitView = false): void {
  if (!root) return;
  const data = root.data;
  const t0 = performance.now();
  root = createTree(data, {
    getHGap: () => hgap,
    getVGap: () => vgap,
  });
  layout[currentLayout](root);
  const elapsed = performance.now() - t0;

  const nodes = getNodes(root);
  const bb = getBoundingBox(root);
  statsEl.innerHTML = [
    `Nodes: ${nodes.length}`,
    `Time: ${elapsed.toFixed(2)}ms`,
    `Size: ${bb.width.toFixed(0)} × ${bb.height.toFixed(0)}`,
  ].join("<br>");

  renderer.setRoot(root, HORIZONTAL_LAYOUTS.has(currentLayout));
  if (fitView) renderer.fitToView();
}

renderer.onClickNode = (node: TidyNode) => {
  if (!node.data.children || node.data.children.length === 0) return;
  node.data.collapsed = !node.data.collapsed;
  relayoutCurrent();
};

layoutSelect.addEventListener("change", () => {
  currentLayout = layoutSelect.value as LayoutName;
  relayoutCurrent(true);
});

let nodeTimeout: ReturnType<typeof setTimeout> | null = null;
nodeSlider.addEventListener("input", () => {
  nodeCount = Number(nodeSlider.value);
  nodeCountDisplay.textContent = String(nodeCount);
  if (nodeTimeout) clearTimeout(nodeTimeout);
  nodeTimeout = setTimeout(() => regenerateAndLayout(true), 150);
});

let gapTimeout: ReturnType<typeof setTimeout> | null = null;

hgapSlider.addEventListener("input", () => {
  hgap = Number(hgapSlider.value);
  hgapDisplay.textContent = String(hgap);
  if (gapTimeout) clearTimeout(gapTimeout);
  gapTimeout = setTimeout(() => relayoutCurrent(true), 100);
});

vgapSlider.addEventListener("input", () => {
  vgap = Number(vgapSlider.value);
  vgapDisplay.textContent = String(vgap);
  if (gapTimeout) clearTimeout(gapTimeout);
  gapTimeout = setTimeout(() => relayoutCurrent(true), 100);
});

function frame(): void {
  renderer.render();
  requestAnimationFrame(frame);
}

regenerateAndLayout(true);
requestAnimationFrame(frame);
