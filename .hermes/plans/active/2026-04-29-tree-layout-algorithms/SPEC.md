# SPEC: Tree Layout 算法库

## 概述

将 [mindmap-layouts](https://github.com/leungwensen/mindmap-layouts) 的 5 种树形布局算法用 TypeScript 重写，应用 [Non-Layered Tidy Tree](https://www.zxch3n.com/tidy/tidy/) 文章中的优化策略，修复已知 bug，增加增量重布局能力，并提供交互式 Playground 示例。

交付物包含三部分：
1. **技术分析报告** (`docs/algorithm-analysis.md`) — 各算法原理深度分析
2. **核心库** (`src/`) — TypeScript 实现的 5 种布局算法
3. **交互式 Playground** (`examples/playground/`) — Canvas 2D 可视化测试应用

## 参考资源

- 算法原仓库：https://github.com/leungwensen/mindmap-layouts
- 优化参考文章：https://www.zxch3n.com/tidy/tidy/
- 原始论文：A. van der Ploeg, "Drawing Non-layered Tidy Trees in Linear Time" (2014)
- Rust/WASM 实现：https://github.com/zxch3n/tidy

---

## 1. 技术分析报告

独立文件 `docs/algorithm-analysis.md`，在实现之前先交付。

### 报告结构

1. **引言** — 树形布局的应用场景和需求背景
2. **经典算法演进**
   - Wetherell-Shannon (1979)：首个 O(n) 树布局，不满足美学规则
   - Reingold-Tilford (1981)：轮廓线方法，O(n)，仅支持二叉树
   - Walker (1990)：扩展到多叉树，但 O(n²) 最坏情况
   - Buchheim et al. (2002)：修正 Walker，O(n) 分层布局
3. **Non-Layered Tidy Tree 算法详解** (van der Ploeg 2014)
   - 七条美学规则定义
   - 分层 vs 非分层对比（空间效率、节点尺寸约束）
   - 核心概念：轮廓线（contour）、线程指针（thread）、IYL 索引列表
   - 两遍遍历：firstWalk（后序）+ secondWalk（前序）
   - O(1) 间距分配技巧（shiftAcceleration / shiftChange）
   - 基于 y 坐标重叠的碰撞检测
4. **五种布局策略分析**
   - 水平方向：RightLogical（基准）、LeftLogical（镜像）
   - 垂直方向：Downward（基准）、Upward（镜像）
   - 双向：Standard（子树拆分 + 合并）
   - 各策略的坐标变换原理
5. **优化策略**
   - 消除 WrappedTree 中间结构
   - Standard 布局子树高度平衡拆分
   - Partial Relayout 增量重布局
   - Bug 修复清单
6. **复杂度对比表**

---

## 2. 核心库设计

### 2.1 项目结构

```
src/
├── index.ts                    # 公开 API 导出
├── types.ts                    # 核心类型定义
├── node.ts                     # TidyNode 数据结构
├── algorithm/
│   ├── non-layered-tidy.ts     # 核心 non-layered tidy tree 算法
│   └── partial-relayout.ts     # 增量重布局
└── layouts/
    ├── right-logical.ts        # 右展开
    ├── left-logical.ts         # 左展开
    ├── downward.ts             # 下展开
    ├── upward.ts               # 上展开
    └── standard.ts             # 标准双向 mindmap
```

### 2.2 核心类型

```typescript
// 用户输入数据
interface InputNode {
  id?: string;
  name?: string;
  width?: number;
  height?: number;
  children?: InputNode[];
  collapsed?: boolean;
  [key: string]: unknown;
}

// 布局选项
interface LayoutOptions {
  getId?: (data: InputNode) => string;
  getWidth?: (data: InputNode) => number;
  getHeight?: (data: InputNode) => number;
  getHGap?: (data: InputNode) => number;
  getVGap?: (data: InputNode) => number;
}

// 布局输出信息
interface NodeInfo {
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

interface Edge {
  source: string;
  target: string;
}

interface BoundingBox {
  left: number;
  top: number;
  width: number;
  height: number;
}
```

### 2.3 TidyNode

内部布局节点，由 `createTree()` 从用户数据构建：

- 树结构：`parent`、`children`、`depth`
- 尺寸：`width`（含 gap）、`height`（含 gap）、`actualWidth`、`actualHeight`、`hgap`、`vgap`
- 坐标：`x`、`y`（左上角，布局后填充）
- 状态：`collapsed`（折叠时不构建子节点）
- 遍历：`eachNode(callback)` 使用栈 + push（非 concat）

算法临时状态（`prelim`、`mod`、`shift`、`change`、线程指针、极值节点等）使用 `WeakMap<TidyNode, AlgoState>` 管理，不污染节点本身，零拷贝替代 WrappedTree。

### 2.4 核心算法

**Non-Layered Tidy Tree**，保留 van der Ploeg 算法的两遍遍历核心逻辑：

1. **深度坐标设置**：在 firstWalk 过程中计算每个节点的深度方向坐标（`y` 或 `x`），值为 `parent的深度坐标 + parent的尺寸`
2. **firstWalk（后序遍历）**：
   - 叶节点：设置自身为极值
   - 内部节点：从左到右处理子节点，对每对相邻子树调用 `separate()` 检测轮廓碰撞
   - `separate()`：同步遍历左子树的右轮廓和右子树的左轮廓，通过线程指针高效跳转，使用 IYL 定位碰撞源
   - `moveSubtree()` + `distributeExtra()`：移动子树并通过 `shiftAcceleration`/`shiftChange` 实现 O(1) 间距均匀分配
3. **secondWalk（前序遍历）**：累加 `mod` 值得到绝对坐标，调用 `addChildSpacing()` 应用延迟的间距分配
4. **normalize**：平移使最小坐标归零

水平/垂直方向统一处理：通过 `isHorizontal` 标志在算法入口交换宽高和 x/y 的语义。

### 2.5 布局策略

5 个布局函数，均为纯函数（接收 TidyNode 树，原地修改坐标，返回根节点）：

| 布局函数 | 实现方式 |
|---------|---------|
| `rightLogical(root)` | `tidyTree(root, horizontal=true)` |
| `leftLogical(root)` | `tidyTree(root, horizontal=true)` + `mirrorX(root)` |
| `downward(root)` | `tidyTree(root, horizontal=false)` |
| `upward(root)` | `tidyTree(root, horizontal=false)` + `mirrorY(root)` |
| `standard(root)` | 子树平衡拆分 → 左/右各自布局 → 左树镜像 → 合并对齐 |

**Standard 布局的子树平衡拆分**：
- 遍历根节点的子节点，计算每个子树的总高度（递归 bounding box）
- 从第一个子节点开始累加高度，当累计超过总高度的一半时，该位置作为拆分点
- 拆分点之前的子节点分配给右树，之后的给左树

### 2.6 增量重布局（Partial Relayout）

```
relayout(changedNode, layoutFn):
  node = changedNode
  while node.parent:
    对 node.parent 的所有子节点：
      清除极值节点的线程指针
    重新运行 layoutSubtree(node.parent, children)
    node = node.parent
  应用 secondWalk 计算绝对坐标
```

复杂度 O(d + m)，d = 变更节点深度，m = 受影响的可见节点数。

### 2.7 公开 API

```typescript
// 构建节点树
export function createTree(data: InputNode, options?: LayoutOptions): TidyNode;

// 5 种布局（纯函数）
export const layout: {
  rightLogical(root: TidyNode): TidyNode;
  leftLogical(root: TidyNode): TidyNode;
  downward(root: TidyNode): TidyNode;
  upward(root: TidyNode): TidyNode;
  standard(root: TidyNode): TidyNode;
};

// 增量重布局
export function relayout(
  node: TidyNode,
  layoutFn: (root: TidyNode) => TidyNode
): TidyNode;

// 辅助函数
export function getBoundingBox(root: TidyNode): BoundingBox;
export function getNodes(root: TidyNode): NodeInfo[];
export function getEdges(root: TidyNode): Edge[];
```

### 2.8 Bug 修复清单

从 mindmap-layouts 移植时修复的问题：

1. **`getEdges()` concat 无效**：`edges.concat(extraEdges)` 返回新数组但未赋值，改为直接返回 `[...edges, ...extraEdges]`
2. **`eachNode()` O(n²) 内存开销**：用 `nodes = children.concat(nodes)` 每次创建新数组，改为 `for (const child of children) nodes.push(child)`
3. **`countByDepth` 未使用**：移除死代码
4. **Standard 布局子树不平衡**：按索引平分改为按子树高度平衡拆分

---

## 3. 测试策略

```
tests/
├── node.test.ts                # TidyNode 构建、遍历、镜像、bounding box
├── algorithm.test.ts           # 核心算法正确性（无重叠、排序保持、对称性）
├── layouts.test.ts             # 5 种布局方向正确、结果坐标验证
└── partial-relayout.test.ts    # 增量重布局结果一致性
```

### 关键测试用例

- **无重叠**：任意两个节点的矩形不相交
- **排序保持**：同层子节点在布局方向上保持原始顺序
- **对称性**：树及其镜像的布局结果互为镜像
- **一致性**：增量重布局与全量重布局的结果一致
- **边界**：空树、单节点、深链（退化为链表）、宽扇形（根节点 100+ 子节点）
- **折叠**：折叠节点不参与布局，展开后布局正确

---

## 4. Example Playground

### 4.1 技术栈

- Vite 应用（pnpm workspace 成员 `examples/playground`）
- Canvas 2D API 渲染（零外部依赖）
- 直接依赖 `tree-layout` 核心库（workspace 引用）

### 4.2 功能

| 功能 | 描述 |
|------|------|
| 布局切换 | 下拉菜单选择 5 种布局，实时重新渲染 |
| 预置数据 | 3-4 棵示例树（小型 ~5 节点、中型 ~50 节点、大型 ~500 节点） |
| Canvas 渲染 | 节点矩形 + 连接线 + 文本标签，根据深度着色 |
| 平移缩放 | 鼠标拖拽平移、滚轮缩放，smooth transform |
| 节点折叠 | 点击节点切换折叠/展开，触发增量重布局 |
| 性能面板 | 显示布局计算耗时（ms）和节点数量 |

### 4.3 项目结构

```
examples/playground/
├── package.json            # workspace 成员，依赖 tree-layout
├── index.html              # 入口 HTML
├── vite.config.ts          # Vite 配置
└── src/
    ├── main.ts             # 应用入口，初始化控件和渲染
    ├── renderer.ts         # Canvas 2D 渲染器（节点、连线、文本）
    ├── controls.ts         # UI 控件（布局选择、数据选择、性能显示）
    └── sample-data.ts      # 预置示例树数据
```

---

## 5. 范围边界

### 包含

- 5 种布局算法的 TypeScript 实现
- Non-layered tidy tree 核心算法
- Partial relayout 增量重布局
- Bug 修复（4 项）
- Standard 布局平衡拆分优化
- 技术分析报告
- 交互式 Canvas Playground
- 单元测试

### 不包含

- 动画过渡效果
- 节点拖拽重排
- 持久化/导入导出
- mindmap-layouts 中计划但未实现的布局类型（fishbone、indented、arc tree 等）
- React/Vue 等框架组件封装
- npm 发布流程
