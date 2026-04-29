import { describe, expect, test } from "vite-plus/test";
import { createTree, getNodes, layout } from "../src/index.ts";
import type { InputNode } from "../src/index.ts";

function noOverlap(root: ReturnType<typeof createTree>): boolean {
  const nodes = getNodes(root);
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const a = nodes[i]!;
      const b = nodes[j]!;
      const overlapX = a.x < b.x + b.width && a.x + a.width > b.x;
      const overlapY = a.y < b.y + b.height && a.y + a.height > b.y;
      if (overlapX && overlapY) return false;
    }
  }
  return true;
}

const mediumTree: InputNode = {
  id: "root",
  width: 60,
  height: 30,
  children: Array.from({ length: 5 }, (_, i) => ({
    id: `c${i}`,
    width: 40 + i * 5,
    height: 25 + i * 3,
    children: Array.from({ length: 3 }, (_, j) => ({
      id: `c${i}-${j}`,
      width: 30,
      height: 20,
    })),
  })),
};

describe("rightLogical", () => {
  test("no overlap", () => {
    const root = createTree(mediumTree);
    layout.rightLogical(root);
    expect(noOverlap(root)).toBe(true);
  });

  test("root is at leftmost x", () => {
    const root = createTree(mediumTree);
    layout.rightLogical(root);
    const nodes = getNodes(root);
    const minX = Math.min(...nodes.map((n) => n.x));
    expect(root.x).toBe(minX);
  });
});

describe("leftLogical", () => {
  test("no overlap", () => {
    const root = createTree(mediumTree);
    layout.leftLogical(root);
    expect(noOverlap(root)).toBe(true);
  });

  test("root is at rightmost x", () => {
    const root = createTree(mediumTree);
    layout.leftLogical(root);
    const nodes = getNodes(root);
    const maxRight = Math.max(...nodes.map((n) => n.x + n.width));
    expect(root.x + root.width).toBeCloseTo(maxRight, 5);
  });
});

describe("downward", () => {
  test("no overlap", () => {
    const root = createTree(mediumTree);
    layout.downward(root);
    expect(noOverlap(root)).toBe(true);
  });

  test("root is at top (smallest y)", () => {
    const root = createTree(mediumTree);
    layout.downward(root);
    const nodes = getNodes(root);
    const minY = Math.min(...nodes.map((n) => n.y));
    expect(root.y).toBe(minY);
  });
});

describe("upward", () => {
  test("no overlap", () => {
    const root = createTree(mediumTree);
    layout.upward(root);
    expect(noOverlap(root)).toBe(true);
  });

  test("root is at bottom (largest y + height)", () => {
    const root = createTree(mediumTree);
    layout.upward(root);
    const nodes = getNodes(root);
    const maxBottom = Math.max(...nodes.map((n) => n.y + n.height));
    expect(root.y + root.height).toBeCloseTo(maxBottom, 5);
  });
});

describe("standard", () => {
  test("no overlap", () => {
    const root = createTree(mediumTree);
    layout.standard(root);
    expect(noOverlap(root)).toBe(true);
  });

  test("children distributed on both sides of root", () => {
    const root = createTree(mediumTree);
    layout.standard(root);
    const rootCenterX = root.x + root.width / 2;
    const leftCount = root.children.filter((c) => c.x + c.width / 2 < rootCenterX).length;
    const rightCount = root.children.filter((c) => c.x + c.width / 2 > rootCenterX).length;
    expect(leftCount).toBeGreaterThan(0);
    expect(rightCount).toBeGreaterThan(0);
  });

  test("single child does not crash", () => {
    const data: InputNode = {
      id: "root",
      width: 60,
      height: 30,
      children: [{ id: "only", width: 40, height: 25 }],
    };
    const root = createTree(data);
    layout.standard(root);
    expect(noOverlap(root)).toBe(true);
  });

  test("no children does not crash", () => {
    const data: InputNode = { id: "root", width: 60, height: 30 };
    const root = createTree(data);
    layout.standard(root);
    expect(root.x).toBe(0);
    expect(root.y).toBe(0);
  });
});
