import { describe, expect, test } from "vite-plus/test";
import { createTree, getNodes, getEdges, getBoundingBox } from "../src/index.ts";
import type { InputNode } from "../src/index.ts";

const simpleTree: InputNode = {
  id: "root",
  name: "Root",
  width: 60,
  height: 30,
  children: [
    {
      id: "a",
      name: "A",
      width: 40,
      height: 30,
      children: [
        { id: "a1", name: "A1", width: 30, height: 20 },
        { id: "a2", name: "A2", width: 30, height: 20 },
      ],
    },
    { id: "b", name: "B", width: 50, height: 30 },
  ],
};

describe("createTree", () => {
  test("builds tree from InputNode", () => {
    const root = createTree(simpleTree);
    expect(root.id).toBe("root");
    expect(root.children).toHaveLength(2);
    expect(root.children[0]!.id).toBe("a");
    expect(root.children[0]!.children).toHaveLength(2);
    expect(root.children[1]!.id).toBe("b");
    expect(root.children[1]!.children).toHaveLength(0);
  });

  test("sets depth correctly", () => {
    const root = createTree(simpleTree);
    expect(root.depth).toBe(0);
    expect(root.children[0]!.depth).toBe(1);
    expect(root.children[0]!.children[0]!.depth).toBe(2);
  });

  test("applies width/height with gaps", () => {
    const root = createTree(simpleTree);
    expect(root.actualWidth).toBe(60);
    expect(root.actualHeight).toBe(30);
    expect(root.width).toBe(60 + 2 * 18);
    expect(root.height).toBe(30 + 2 * 18);
  });

  test("sets parent references", () => {
    const root = createTree(simpleTree);
    expect(root.parent).toBeNull();
    expect(root.children[0]!.parent).toBe(root);
    expect(root.children[0]!.children[0]!.parent).toBe(root.children[0]);
  });

  test("skips collapsed children", () => {
    const data: InputNode = {
      id: "root",
      width: 50,
      height: 30,
      children: [
        {
          id: "c",
          width: 40,
          height: 30,
          collapsed: true,
          children: [{ id: "c1", width: 30, height: 20 }],
        },
      ],
    };
    const root = createTree(data);
    expect(root.children).toHaveLength(1);
    expect(root.children[0]!.collapsed).toBe(true);
    expect(root.children[0]!.children).toHaveLength(0);
  });

  test("uses custom options", () => {
    const root = createTree(simpleTree, {
      getId: (d) => `custom-${d.id}`,
      getWidth: () => 100,
      getHeight: () => 50,
      getHGap: () => 10,
      getVGap: () => 5,
    });
    expect(root.id).toBe("custom-root");
    expect(root.actualWidth).toBe(100);
    expect(root.actualHeight).toBe(50);
    expect(root.hgap).toBe(10);
    expect(root.vgap).toBe(5);
    expect(root.width).toBe(120);
    expect(root.height).toBe(60);
  });
});

describe("eachNode", () => {
  test("traverses in pre-order", () => {
    const root = createTree(simpleTree);
    const ids: string[] = [];
    root.eachNode((n) => ids.push(n.id));
    expect(ids).toEqual(["root", "a", "a1", "a2", "b"]);
  });
});

describe("mirrorX", () => {
  test("mirrors x coordinates", () => {
    const root = createTree(simpleTree);
    root.x = 0;
    root.children[0]!.x = 10;
    root.children[1]!.x = 50;
    const bbBefore = root.getBoundingBox();
    root.mirrorX();
    const bbAfter = root.getBoundingBox();
    expect(bbAfter.width).toBeCloseTo(bbBefore.width, 5);
  });
});

describe("mirrorY", () => {
  test("mirrors y coordinates", () => {
    const root = createTree(simpleTree);
    root.y = 0;
    root.children[0]!.y = 10;
    root.children[1]!.y = 50;
    const bbBefore = root.getBoundingBox();
    root.mirrorY();
    const bbAfter = root.getBoundingBox();
    expect(bbAfter.height).toBeCloseTo(bbBefore.height, 5);
  });
});

describe("getNodes", () => {
  test("returns all nodes with info", () => {
    const root = createTree(simpleTree);
    const nodes = getNodes(root);
    expect(nodes).toHaveLength(5);
    expect(nodes[0]!.id).toBe("root");
    expect(nodes[0]!.data).toBe(simpleTree);
    expect(nodes[0]!.depth).toBe(0);
  });
});

describe("getEdges", () => {
  test("returns all edges", () => {
    const root = createTree(simpleTree);
    const edges = getEdges(root);
    expect(edges).toHaveLength(4);
    expect(edges).toContainEqual({ source: "root", target: "a" });
    expect(edges).toContainEqual({ source: "root", target: "b" });
    expect(edges).toContainEqual({ source: "a", target: "a1" });
    expect(edges).toContainEqual({ source: "a", target: "a2" });
  });
});

describe("getBoundingBox", () => {
  test("computes bounding box", () => {
    const root = createTree(simpleTree);
    root.x = 10;
    root.y = 20;
    root.children[0]!.x = 0;
    root.children[0]!.y = 100;
    root.children[1]!.x = 5;
    root.children[1]!.y = 50;
    root.children[0]!.children[0]!.x = 200;
    root.children[0]!.children[0]!.y = 150;
    root.children[0]!.children[1]!.x = 300;
    root.children[0]!.children[1]!.y = 10;
    const bb = getBoundingBox(root);
    expect(bb.left).toBe(0);
    expect(bb.top).toBe(10);
  });
});

describe("translate", () => {
  test("translates all nodes", () => {
    const root = createTree(simpleTree);
    root.translate(100, 200);
    root.eachNode((n) => {
      expect(n.x).toBe(100);
      expect(n.y).toBe(200);
    });
  });
});
