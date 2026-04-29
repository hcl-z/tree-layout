# Tree Layout 算法库 实现计划

> **For agentic workers:** Use hermes-execute to implement this plan task-by-task.

**Goal:** 用 TypeScript 实现 5 种树形布局算法（基于 non-layered tidy tree），先交付技术分析报告，然后实现核心库和交互式 Playground。

**Architecture:** 核心库为纯函数式 API，输入 `InputNode` 数据树经 `createTree()` 构建为 `TidyNode` 树，再传给 5 个布局函数之一进行原地坐标计算。算法临时状态通过 `WeakMap` 管理，避免 WrappedTree 拷贝。Playground 作为 pnpm workspace 成员使用 Canvas 2D 渲染。

**Tech Stack:** TypeScript (strict, ESNext), Vite+ (`vp` CLI), tsdown (打包), vitest (测试), pnpm workspace, Canvas 2D API

```
Scale: M
Reason: 核心算法移植 + 5 种布局 + 技术报告 + Playground 应用
Target task count: 5 tasks
```

---

### Task 1: 技术分析报告

**Objective:** 交付 `docs/algorithm-analysis.md` 技术报告，分析树形布局算法演进、non-layered tidy tree 核心原理、五种布局策略和优化策略。

**Files:**
- Create: `docs/algorithm-analysis.md`

**Approach:**

编写完整的中文技术分析文档，结构如下：

1. **引言** — 树形布局的应用场景（思维导图、组织架构图、文件浏览器、决策树）和核心挑战
2. **经典算法演进**
   - Wetherell-Shannon (1979)：首个 O(n) 树布局，不满足"相同子树相同绘制"的美学规则
   - Reingold-Tilford (1981)：引入轮廓线（contour），O(n)，仅支持二叉树
   - Walker (1990)：扩展到多叉树，但 O(n²) 最坏情况
   - Buchheim et al. (2002)：修正 Walker 回到 O(n)，仅支持分层布局
3. **Non-Layered Tidy Tree 算法详解** (van der Ploeg 2014)
   - 七条美学规则定义
   - 分层 vs 非分层对比（空间效率、节点尺寸约束）
   - 核心概念：轮廓线（contour）、线程指针（thread）、IYL 索引列表、极值节点（extreme）
   - 两遍遍历伪代码：firstWalk（后序）+ secondWalk（前序）
   - O(1) 间距分配技巧（shiftAcceleration / shiftChange）
   - 基于 y 坐标重叠的碰撞检测
4. **五种布局策略分析** — 各策略的方向变换原理，Standard 布局的子树拆分
5. **优化策略** — 消除 WrappedTree、Standard 平衡拆分、Partial Relayout、Bug 修复清单
6. **复杂度对比表**

报告要求全中文撰写（技术术语后跟英文原文），包含伪代码和对比表格，3000-5000 字。

**Verification:**
```bash
test -s docs/algorithm-analysis.md && echo "OK"
grep -c "^## " docs/algorithm-analysis.md
# 预期：6 个二级标题
```

---

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

### Task 3: 五种布局策略

**Objective:** 实现 5 个布局函数（rightLogical、leftLogical、downward、upward、standard），其中 standard 使用子树高度平衡拆分。完成 layout 对象导出。

**Files:**
- Create: `src/layouts/right-logical.ts`
- Create: `src/layouts/left-logical.ts`
- Create: `src/layouts/downward.ts`
- Create: `src/layouts/upward.ts`
- Create: `src/layouts/standard.ts`
- Create: `tests/layouts.test.ts`
- Modify: `src/index.ts` — 添加 layout 对象导出

**Approach:**

4 个方向布局各自很短（3-8 行函数体）：
- `rightLogical` = `nonLayeredTidyTree(root, true)`
- `leftLogical` = `nonLayeredTidyTree(root, true)` + `root.mirrorX()`
- `downward` = `nonLayeredTidyTree(root, false)`
- `upward` = `nonLayeredTidyTree(root, false)` + `root.mirrorY()`

`standard` 实现子树高度平衡拆分：
```typescript
export function standard(root: TidyNode): TidyNode {
  if (root.children.length === 0) { root.x = 0; root.y = 0; return root; }

  // 按子树高度平衡拆分
  const heights = root.children.map((c) => getSubtreeHeight(c));
  const total = heights.reduce((a, b) => a + b, 0);
  let cum = 0, splitIndex = root.children.length;
  for (let i = 0; i < heights.length; i++) {
    cum += heights[i]!;
    if (cum >= total / 2) { splitIndex = i + 1; break; }
  }
  splitIndex = Math.max(1, Math.min(splitIndex, root.children.length - 1));
  if (root.children.length === 1) splitIndex = 1;

  const rightChildren = root.children.slice(0, splitIndex);
  const leftChildren = root.children.slice(splitIndex);

  // 构建临时子树 → 分别布局 → 左树镜像 → 对齐合并 → 恢复 parent
  // （详细实现见代码）
}
```

**`src/index.ts`** 更新：
```typescript
// 追加
import { rightLogical } from "./layouts/right-logical.ts";
import { leftLogical } from "./layouts/left-logical.ts";
import { downward } from "./layouts/downward.ts";
import { upward } from "./layouts/upward.ts";
import { standard } from "./layouts/standard.ts";
export const layout = { rightLogical, leftLogical, downward, upward, standard };
export { rightLogical, leftLogical, downward, upward, standard };
```

**`tests/layouts.test.ts`** 覆盖每种布局：
- 无重叠断言
- 方向正确性（rightLogical 根在最左、leftLogical 根在最右、downward 根在最上、upward 根在最下）
- Standard 子节点分布在根两侧
- 单子节点 standard 不崩溃

**Verification:**
```bash
vp test
# 预期：所有测试文件通过
vp check
# 预期：无 lint/type 错误
vp pack
# 预期：构建成功
```

---

### Task 4: Example Playground

**Objective:** 创建 `examples/playground` 作为 pnpm workspace 成员，实现 Canvas 2D 交互式 Playground — 布局切换、预置数据、平移缩放、节点折叠、性能面板。

**Files:**
- Create: `examples/playground/package.json`
- Create: `examples/playground/tsconfig.json`
- Create: `examples/playground/vite.config.ts`
- Create: `examples/playground/index.html`
- Create: `examples/playground/src/main.ts`
- Create: `examples/playground/src/renderer.ts`
- Create: `examples/playground/src/sample-data.ts`

**Approach:**

**`package.json`**：workspace 成员，依赖 `"tree-layout": "workspace:*"` 和 `"vite": "catalog:"`。

**`index.html`**：深色主题页面，顶部控件栏（布局选择、数据选择），右下角性能统计，全屏 Canvas。

**`src/sample-data.ts`**：3 棵预置树 — 小型（~5 节点，手写组织架构）、中型（~50 节点，随机生成 depth=3 branching=4）、大型（~500 节点，depth=4 branching=5）。

**`src/renderer.ts`** — Canvas 2D 渲染器类：
- 绘制连线（半透明白线）
- 绘制节点矩形（按深度着色，圆角）+ 文本标签
- 已折叠节点显示 "+" 标记，有子节点的显示子节点数
- 鼠标拖拽平移（mousedown/mousemove/mouseup）
- 滚轮缩放（wheel event，0.1-5x 范围）
- 支持 HiDPI（devicePixelRatio）
- 点击检测回调 `onClickNode`

**`src/main.ts`** — 应用入口：
- 监听布局选择和数据选择的 change 事件
- `doLayout()`：createTree → layout[name] → 计时 → 统计节点数/画布大小
- 节点点击：切换 `data.collapsed` → 重新 doLayout
- requestAnimationFrame 渲染循环

运行方式：
```bash
cd /Users/clhong/person/tree-layout && pnpm install
cd examples/playground && pnpm dev
```

**Verification:**
```bash
cd /Users/clhong/person/tree-layout && pnpm install
cd examples/playground && pnpm dev &
# 浏览器访问 http://localhost:5173
# 验证：5 种布局可切换、3 种数据可选、拖拽缩放正常、点击折叠/展开、性能面板显示
kill %1
```

---

### Task 5: 最终验证与项目清理

**Objective:** 全量 check + test + build，更新 package.json 描述和 README.md。

**Files:**
- Modify: `package.json` — 更新 description
- Modify: `README.md` — 更新为项目实际内容（安装、使用示例、5 种布局说明、开发命令、Playground 说明）

**Approach:**

1. 更新 `package.json` description 为 `"A TypeScript library for tree layout algorithms with 5 layout strategies based on non-layered tidy tree"`

2. 更新 `README.md`：安装命令、使用示例代码（createTree → layout.downward → getNodes）、5 种布局类型说明、开发命令（pnpm install/test/check/build）、Playground 启动命令

3. 运行全量验证

**Verification:**
```bash
vp check && echo "CHECK OK"
vp test && echo "TEST OK"
vp pack && echo "BUILD OK"
ls dist/index.mjs dist/index.d.mts && echo "DIST OK"
# 预期：全部 OK
```
