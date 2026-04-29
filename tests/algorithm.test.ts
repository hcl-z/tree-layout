import { describe, expect, test } from "vite-plus/test";
import { createTree, nonLayeredTidyTree, getNodes } from "../src/index.ts";
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

function allCoordsNonNegative(root: ReturnType<typeof createTree>): boolean {
  const nodes = getNodes(root);
  return nodes.every((n) => n.x >= -0.001 && n.y >= -0.001);
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

describe("nonLayeredTidyTree vertical", () => {
  test("no overlap on medium tree", () => {
    const root = createTree(mediumTree);
    nonLayeredTidyTree(root, false);
    expect(noOverlap(root)).toBe(true);
  });

  test("all coordinates non-negative", () => {
    const root = createTree(mediumTree);
    nonLayeredTidyTree(root, false);
    expect(allCoordsNonNegative(root)).toBe(true);
  });

  test("root is at top (smallest y)", () => {
    const root = createTree(mediumTree);
    nonLayeredTidyTree(root, false);
    const nodes = getNodes(root);
    const minY = Math.min(...nodes.map((n) => n.y));
    expect(root.y).toBe(minY);
  });

  test("children order preserved (x-axis)", () => {
    const root = createTree(mediumTree);
    nonLayeredTidyTree(root, false);
    for (let i = 1; i < root.children.length; i++) {
      expect(root.children[i]!.x).toBeGreaterThan(root.children[i - 1]!.x);
    }
  });
});

describe("nonLayeredTidyTree horizontal", () => {
  test("no overlap on medium tree", () => {
    const root = createTree(mediumTree);
    nonLayeredTidyTree(root, true);
    expect(noOverlap(root)).toBe(true);
  });

  test("all coordinates non-negative", () => {
    const root = createTree(mediumTree);
    nonLayeredTidyTree(root, true);
    expect(allCoordsNonNegative(root)).toBe(true);
  });

  test("root is at left (smallest x)", () => {
    const root = createTree(mediumTree);
    nonLayeredTidyTree(root, true);
    const nodes = getNodes(root);
    const minX = Math.min(...nodes.map((n) => n.x));
    expect(root.x).toBe(minX);
  });

  test("children order preserved (y-axis)", () => {
    const root = createTree(mediumTree);
    nonLayeredTidyTree(root, true);
    for (let i = 1; i < root.children.length; i++) {
      expect(root.children[i]!.y).toBeGreaterThan(root.children[i - 1]!.y);
    }
  });
});

describe("edge cases", () => {
  test("single node", () => {
    const root = createTree({ id: "only", width: 50, height: 30 });
    nonLayeredTidyTree(root, false);
    expect(root.x).toBe(0);
    expect(root.y).toBe(0);
    expect(noOverlap(root)).toBe(true);
  });

  test("deep chain (linked list)", () => {
    let data: InputNode = { id: "d0", width: 40, height: 20 };
    for (let i = 9; i >= 1; i--) {
      data = { id: `d${i}`, width: 40, height: 20, children: [data] };
    }
    const root = createTree(data);
    nonLayeredTidyTree(root, false);
    expect(noOverlap(root)).toBe(true);
    expect(allCoordsNonNegative(root)).toBe(true);
  });

  test("wide fan (100 children)", () => {
    const data: InputNode = {
      id: "fan",
      width: 60,
      height: 30,
      children: Array.from({ length: 100 }, (_, i) => ({
        id: `f${i}`,
        width: 30,
        height: 20,
      })),
    };
    const root = createTree(data);
    nonLayeredTidyTree(root, false);
    expect(noOverlap(root)).toBe(true);
    expect(allCoordsNonNegative(root)).toBe(true);
  });

  test("variable-size nodes", () => {
    const data: InputNode = {
      id: "root",
      width: 100,
      height: 50,
      children: [
        { id: "small", width: 20, height: 10 },
        { id: "big", width: 200, height: 100 },
        { id: "medium", width: 60, height: 40 },
      ],
    };
    const root = createTree(data);
    nonLayeredTidyTree(root, false);
    expect(noOverlap(root)).toBe(true);
  });
});
