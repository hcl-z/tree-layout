import { expect, test } from "vite-plus/test";
import {
  TidyNode,
  createTree,
  getNodes,
  getEdges,
  getBoundingBox,
  nonLayeredTidyTree,
  relayout,
} from "../src/index.ts";
import type { InputNode, LayoutOptions, NodeInfo, Edge, BoundingBox } from "../src/index.ts";

test("exports createTree", () => {
  expect(typeof createTree).toBe("function");
});

test("exports TidyNode", () => {
  expect(TidyNode).toBeDefined();
});

test("exports getNodes", () => {
  expect(typeof getNodes).toBe("function");
});

test("exports getEdges", () => {
  expect(typeof getEdges).toBe("function");
});

test("exports getBoundingBox", () => {
  expect(typeof getBoundingBox).toBe("function");
});

test("exports nonLayeredTidyTree", () => {
  expect(typeof nonLayeredTidyTree).toBe("function");
});

test("exports relayout", () => {
  expect(typeof relayout).toBe("function");
});

test("type exports are usable", () => {
  const node: InputNode = { id: "test", width: 10, height: 10 };
  const opts: LayoutOptions = { getId: (d) => String(d.id) };
  const root = createTree(node, opts);
  const nodes: NodeInfo[] = getNodes(root);
  const edges: Edge[] = getEdges(root);
  const bb: BoundingBox = getBoundingBox(root);
  expect(nodes).toHaveLength(1);
  expect(edges).toHaveLength(0);
  expect(bb.width).toBeGreaterThan(0);
});
