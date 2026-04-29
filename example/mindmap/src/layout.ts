import {
  createTree,
  layout as treeLayout,
  getNodes,
  getEdges,
  type InputNode,
  type NodeInfo,
} from "auto-tree-layout";
import type { Node, Edge } from "@xyflow/react";
import type { LayoutType } from "./store";

const BRANCH_COLORS = [
  "#4fc3f7",
  "#81c784",
  "#ffb74d",
  "#f06292",
  "#ba68c8",
  "#4dd0e1",
  "#fff176",
  "#a1887f",
];

function assignBranchColors(data: InputNode): Map<string, string> {
  const colorMap = new Map<string, string>();
  if (!data.children) return colorMap;
  data.children.forEach((child, i) => {
    const color = BRANCH_COLORS[i % BRANCH_COLORS.length]!;
    assignColorRecursive(child, color, colorMap);
  });
  return colorMap;
}

function assignColorRecursive(node: InputNode, color: string, map: Map<string, string>) {
  if (node.id) map.set(node.id, color);
  node.children?.forEach((child) => assignColorRecursive(child, color, map));
}

let measureCtx: CanvasRenderingContext2D | null = null;

function measureTextWidth(text: string, fontSize: number): number {
  if (!measureCtx) {
    const canvas = document.createElement("canvas");
    measureCtx = canvas.getContext("2d")!;
  }
  measureCtx.font = `${fontSize}px system-ui, -apple-system, sans-serif`;
  return Math.ceil(measureCtx.measureText(text).width);
}

function getNodeWidth(node: InputNode, isRoot: boolean): number {
  const fontSize = isRoot ? 18 : 14;
  const text = node.name || "主题";
  const textWidth = measureTextWidth(text, fontSize);
  const padding = isRoot ? 48 : 32;
  return Math.max(textWidth + padding, isRoot ? 120 : 72);
}

function getNodeHeight(_node: InputNode, isRoot: boolean): number {
  return isRoot ? 48 : 36;
}

function countDescendants(node: InputNode): number {
  if (!node.children) return 0;
  let count = node.children.length;
  for (const child of node.children) count += countDescendants(child);
  return count;
}

const HORIZONTAL_LAYOUTS = new Set<LayoutType>(["rightLogical", "leftLogical", "standard"]);

function getHandleIds(
  layoutType: LayoutType,
  parentX: number,
  childX: number,
): { sourceHandle: string; targetHandle: string } {
  if (layoutType === "downward")
    return { sourceHandle: "source-bottom", targetHandle: "target-top" };
  if (layoutType === "upward") return { sourceHandle: "source-top", targetHandle: "target-bottom" };
  if (layoutType === "rightLogical")
    return { sourceHandle: "source-right", targetHandle: "target-left" };
  if (layoutType === "leftLogical")
    return { sourceHandle: "source-left", targetHandle: "target-right" };
  if (childX >= parentX) return { sourceHandle: "source-right", targetHandle: "target-left" };
  return { sourceHandle: "source-left", targetHandle: "target-right" };
}

export interface LayoutResult {
  nodes: Node[];
  edges: Edge[];
}

export function computeLayout(data: InputNode, layoutType: LayoutType): LayoutResult {
  const rootId = data.id ?? "";
  const colorMap = assignBranchColors(data);

  const root = createTree(data, {
    getId: (d) => String(d.id ?? d.name ?? ""),
    getWidth: (d) => getNodeWidth(d, d.id === rootId),
    getHeight: (d) => getNodeHeight(d, d.id === rootId),
    getHGap: () => 24,
    getVGap: () => 16,
  });

  treeLayout[layoutType](root);

  const nodeInfos = getNodes(root);
  const edgeInfos = getEdges(root);

  const rootInfo = nodeInfos.find((n) => n.id === rootId);
  const rootOffsetX = rootInfo ? rootInfo.x + rootInfo.hgap : 0;
  const rootOffsetY = rootInfo ? rootInfo.y + rootInfo.vgap : 0;

  const nodeMap = new Map<string, NodeInfo>();
  for (const n of nodeInfos) nodeMap.set(n.id, n);

  const nodes: Node[] = nodeInfos.map((n) => {
    const isRoot = n.id === rootId;
    const originalNode = findInputNode(data, n.id);
    const isCollapsed = originalNode?.collapsed ?? false;
    const descendantCount = isCollapsed ? countDescendants(originalNode!) : 0;
    const hasChildren = (originalNode?.children?.length ?? 0) > 0;

    return {
      id: n.id,
      type: "mindmap",
      position: { x: n.x + n.hgap - rootOffsetX, y: n.y + n.vgap - rootOffsetY },
      width: n.actualWidth,
      height: n.actualHeight,
      data: {
        label: n.data.name ?? "主题",
        width: n.actualWidth,
        height: n.actualHeight,
        isRoot,
        depth: n.depth,
        branchColor: isRoot ? "#7c4dff" : (colorMap.get(n.id) ?? "#666"),
        collapsed: isCollapsed,
        descendantCount,
        hasChildren,
        layoutType,
      },
    };
  });

  const edges: Edge[] = edgeInfos.map((e) => {
    const sourceInfo = nodeMap.get(e.source);
    const targetInfo = nodeMap.get(e.target);
    const { sourceHandle, targetHandle } = getHandleIds(
      layoutType,
      sourceInfo?.centerX ?? 0,
      targetInfo?.centerX ?? 0,
    );

    return {
      id: `${e.source}->${e.target}`,
      source: e.source,
      target: e.target,
      type: "mindmap",
      sourceHandle,
      targetHandle,
      data: {
        branchColor: colorMap.get(e.target) ?? "#666",
      },
    };
  });

  return { nodes, edges };
}

function findInputNode(root: InputNode, id: string): InputNode | null {
  if (root.id === id) return root;
  for (const child of root.children ?? []) {
    const found = findInputNode(child, id);
    if (found) return found;
  }
  return null;
}

export { HORIZONTAL_LAYOUTS };
