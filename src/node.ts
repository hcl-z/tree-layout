import type { InputNode, LayoutOptions, BoundingBox, NodeInfo, Edge } from "./types.ts";

const DEFAULT_HEIGHT = 36;
const DEFAULT_GAP = 18;

export class TidyNode {
  data: InputNode;
  id: string;
  width: number;
  height: number;
  actualWidth: number;
  actualHeight: number;
  hgap: number;
  vgap: number;
  x = 0;
  y = 0;
  depth: number;
  children: TidyNode[];
  parent: TidyNode | null;
  collapsed: boolean;

  constructor(
    data: InputNode,
    id: string,
    actualWidth: number,
    actualHeight: number,
    hgap: number,
    vgap: number,
    depth: number,
    parent: TidyNode | null,
  ) {
    this.data = data;
    this.id = id;
    this.actualWidth = actualWidth;
    this.actualHeight = actualHeight;
    this.hgap = hgap;
    this.vgap = vgap;
    this.width = actualWidth + 2 * hgap;
    this.height = actualHeight + 2 * vgap;
    this.depth = depth;
    this.parent = parent;
    this.children = [];
    this.collapsed = data.collapsed ?? false;
  }

  eachNode(callback: (node: TidyNode) => void): void {
    const stack: TidyNode[] = [this];
    let node: TidyNode | undefined;
    while ((node = stack.pop())) {
      callback(node);
      for (let i = node.children.length - 1; i >= 0; i--) stack.push(node.children[i]!);
    }
  }

  getBoundingBox(): BoundingBox {
    let left = Infinity;
    let top = Infinity;
    let right = -Infinity;
    let bottom = -Infinity;
    this.eachNode((n) => {
      left = Math.min(left, n.x);
      top = Math.min(top, n.y);
      right = Math.max(right, n.x + n.width);
      bottom = Math.max(bottom, n.y + n.height);
    });
    return { left, top, width: right - left, height: bottom - top };
  }

  translate(tx: number, ty: number): void {
    this.eachNode((n) => {
      n.x += tx;
      n.y += ty;
    });
  }

  mirrorX(): void {
    const bb = this.getBoundingBox();
    this.eachNode((n) => {
      n.x = bb.left + (bb.width - (n.x - bb.left) - n.width);
    });
  }

  mirrorY(): void {
    const bb = this.getBoundingBox();
    this.eachNode((n) => {
      n.y = bb.top + (bb.height - (n.y - bb.top) - n.height);
    });
  }
}

export function createTree(data: InputNode, options?: LayoutOptions): TidyNode {
  const getId = options?.getId ?? ((d: InputNode) => String(d.id ?? d.name ?? ""));
  const getWidth = options?.getWidth ?? ((d: InputNode) => d.width ?? (d.name ?? " ").length * 18);
  const getHeight = options?.getHeight ?? ((d: InputNode) => d.height ?? DEFAULT_HEIGHT);
  const getHGap =
    options?.getHGap ??
    ((d: InputNode) => ((d as Record<string, unknown>).hgap as number) ?? DEFAULT_GAP);
  const getVGap =
    options?.getVGap ??
    ((d: InputNode) => ((d as Record<string, unknown>).vgap as number) ?? DEFAULT_GAP);

  const root = new TidyNode(
    data,
    getId(data),
    getWidth(data),
    getHeight(data),
    getHGap(data),
    getVGap(data),
    0,
    null,
  );

  const stack: TidyNode[] = [root];
  let current: TidyNode | undefined;
  while ((current = stack.pop())) {
    if (current.collapsed) continue;
    const children = current.data.children;
    if (!children) continue;
    for (const childData of children) {
      const child = new TidyNode(
        childData,
        getId(childData),
        getWidth(childData),
        getHeight(childData),
        getHGap(childData),
        getVGap(childData),
        current.depth + 1,
        current,
      );
      current.children.push(child);
      stack.push(child);
    }
  }
  return root;
}

export function getNodes(root: TidyNode): NodeInfo[] {
  const nodes: NodeInfo[] = [];
  root.eachNode((n) => {
    nodes.push({
      data: n.data,
      id: n.id,
      x: n.x,
      y: n.y,
      centerX: n.x + n.width / 2,
      centerY: n.y + n.height / 2,
      width: n.width,
      height: n.height,
      actualWidth: n.actualWidth,
      actualHeight: n.actualHeight,
      hgap: n.hgap,
      vgap: n.vgap,
      depth: n.depth,
    });
  });
  return nodes;
}

export function getEdges(root: TidyNode): Edge[] {
  const edges: Edge[] = [];
  root.eachNode((n) => {
    for (const child of n.children) {
      edges.push({ source: n.id, target: child.id });
    }
  });
  return edges;
}

export function getBoundingBox(root: TidyNode): BoundingBox {
  return root.getBoundingBox();
}
