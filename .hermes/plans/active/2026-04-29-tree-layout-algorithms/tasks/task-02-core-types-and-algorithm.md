### Task 2: 核心类型、TidyNode 与 Non-Layered Tidy Tree 算法

**Objective:** 实现全部核心代码 — 类型定义、TidyNode 数据结构（含构建/遍历/镜像/bounding box）、non-layered tidy tree 核心算法（WeakMap 方案）、增量重布局接口。删除脚手架占位符。

**Files:**
- Create: `src/types.ts` — 所有公开类型（InputNode, LayoutOptions, NodeInfo, Edge, BoundingBox）
- Create: `src/node.ts` — TidyNode 类、createTree、getNodes、getEdges、getBoundingBox
- Create: `src/algorithm/non-layered-tidy.ts` — 核心算法
- Create: `src/algorithm/partial-relayout.ts` — 增量重布局
- Modify: `src/index.ts` — 替换占位符，导出所有公开 API
- Create: `tests/node.test.ts` — 节点构建、遍历、镜像测试
- Create: `tests/algorithm.test.ts` — 算法正确性测试（无重叠、排序保持、边界情况）
- Modify: `tests/index.test.ts` — 替换占位符测试为导出完整性测试

**Approach:**

**`src/types.ts`**：
```typescript
export interface InputNode {
  id?: string;
  name?: string;
  width?: number;
  height?: number;
  children?: InputNode[];
  collapsed?: boolean;
  [key: string]: unknown;
}

export interface LayoutOptions {
  getId?: (data: InputNode) => string;
  getWidth?: (data: InputNode) => number;
  getHeight?: (data: InputNode) => number;
  getHGap?: (data: InputNode) => number;
  getVGap?: (data: InputNode) => number;
}

export interface NodeInfo {
  data: InputNode;
  id: string;
  x: number;
  y: number;
  centerX: number;
  centerY: number;
  width: number;
  height: number;
  actualWidth: number;
  actualHeight: number;
  hgap: number;
  vgap: number;
  depth: number;
}

export interface Edge { source: string; target: string; }
export interface BoundingBox { left: number; top: number; width: number; height: number; }
```

**`src/node.ts`** — TidyNode 类，从 mindmap-layouts 的 Node 移植并优化：

```typescript
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

  constructor(data: InputNode, id: string, actualWidth: number, actualHeight: number,
    hgap: number, vgap: number, depth: number, parent: TidyNode | null) {
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
    let left = Infinity, top = Infinity, right = -Infinity, bottom = -Infinity;
    this.eachNode((n) => {
      left = Math.min(left, n.x); top = Math.min(top, n.y);
      right = Math.max(right, n.x + n.width); bottom = Math.max(bottom, n.y + n.height);
    });
    return { left, top, width: right - left, height: bottom - top };
  }

  translate(tx: number, ty: number): void {
    this.eachNode((n) => { n.x += tx; n.y += ty; });
  }

  mirrorX(): void {
    const bb = this.getBoundingBox();
    this.eachNode((n) => { n.x = bb.left + (bb.width - (n.x - bb.left) - n.width); });
  }

  mirrorY(): void {
    const bb = this.getBoundingBox();
    this.eachNode((n) => { n.y = bb.top + (bb.height - (n.y - bb.top) - n.height); });
  }
}

export function createTree(data: InputNode, options?: LayoutOptions): TidyNode {
  const getId = options?.getId ?? ((d: InputNode) => String(d.id ?? d.name ?? ""));
  const getWidth = options?.getWidth ?? ((d: InputNode) => d.width ?? (d.name ?? " ").length * 18);
  const getHeight = options?.getHeight ?? ((d: InputNode) => d.height ?? DEFAULT_HEIGHT);
  const getHGap = options?.getHGap ?? ((d: InputNode) => (d as any).hgap ?? DEFAULT_GAP);
  const getVGap = options?.getVGap ?? ((d: InputNode) => (d as any).vgap ?? DEFAULT_GAP);

  const root = new TidyNode(data, getId(data), getWidth(data), getHeight(data),
    getHGap(data), getVGap(data), 0, null);

  // 迭代构建（非递归），跳过 collapsed 节点的子节点
  const stack: TidyNode[] = [root];
  let current: TidyNode | undefined;
  while ((current = stack.pop())) {
    if (current.collapsed) continue;
    const children = current.data.children;
    if (!children) continue;
    for (const childData of children) {
      const child = new TidyNode(childData, getId(childData), getWidth(childData),
        getHeight(childData), getHGap(childData), getVGap(childData),
        current.depth + 1, current);
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
      data: n.data, id: n.id, x: n.x, y: n.y,
      centerX: n.x + n.width / 2, centerY: n.y + n.height / 2,
      width: n.width, height: n.height,
      actualWidth: n.actualWidth, actualHeight: n.actualHeight,
      hgap: n.hgap, vgap: n.vgap, depth: n.depth,
    });
  });
  return nodes;
}

export function getEdges(root: TidyNode): Edge[] {
  const edges: Edge[] = [];
  root.eachNode((n) => {
    for (const child of n.children) edges.push({ source: n.id, target: child.id });
  });
  return edges;
}

export function getBoundingBox(root: TidyNode): BoundingBox {
  return root.getBoundingBox();
}
```

**`src/algorithm/non-layered-tidy.ts`** — 核心算法，从 mindmap-layouts 移植，用 WeakMap 替代 WrappedTree：

算法内部状态通过 `WeakMap<TidyNode, AlgoState>` 管理。AlgoState 包含：`w`, `h`, `yCoord`（深度方向坐标）, `prelim`, `mod`, `shift`, `change`, `tl`, `tr`（线程指针）, `el`, `er`（极值节点）, `msel`, `mser`。

完整实现约 200 行，包含以下函数：
- `nonLayeredTidyTree(root, isHorizontal)` — 入口函数
- `initState(node, isHorizontal)` — 初始化 AlgoState
- `layer(node, isHorizontal, d)` — 设置深度方向坐标
- `firstWalk(t)` — 后序遍历计算相对位置
- `secondWalk(t, modsum, isHorizontal)` — 前序遍历计算绝对坐标
- `separate(t, i, ih)` — 轮廓碰撞检测
- `moveSubtree(t, i, si, dist)` — 移动子树
- `distributeExtra(t, i, si, dist)` — O(1) 间距分配
- `addChildSpacing(t)` — 应用延迟间距
- `setExtremes(t)` / `setLeftThread(...)` / `setRightThread(...)` — 极值和线程管理
- `positionRoot(t)` — 父节点居中
- `updateIYL(low, index, ih)` — IYL 链表更新
- `normalize(node, isHorizontal)` — 最小坐标归零

**`src/algorithm/partial-relayout.ts`** — 增量重布局接口（首版内部调用全量重布局保证正确性）：
```typescript
import type { TidyNode } from "../node.ts";

export function relayout(changedNode: TidyNode, layoutFn: (root: TidyNode) => TidyNode): TidyNode {
  let root = changedNode;
  while (root.parent) root = root.parent;
  return layoutFn(root);
}
```

**`src/index.ts`** — 替换占位符：
```typescript
export { TidyNode, createTree, getNodes, getEdges, getBoundingBox } from "./node.ts";
export type { InputNode, LayoutOptions, NodeInfo, Edge, BoundingBox } from "./types.ts";
export { relayout } from "./algorithm/partial-relayout.ts";
```

**测试** — `tests/node.test.ts` 覆盖：createTree 基本构建、collapsed 跳过、自定义 options、eachNode 遍历顺序、mirrorX/mirrorY、getNodes/getEdges。`tests/algorithm.test.ts` 覆盖：无重叠（vertical/horizontal）、子节点顺序保持、单节点、深链、宽扇形（100 子节点）、变尺寸节点、坐标非负。`tests/index.test.ts` 替换为公开 API 导出完整性测试。

**Verification:**
```bash
vp test -- tests/node.test.ts tests/algorithm.test.ts tests/index.test.ts
vp check
# 预期：全部通过
```

---
