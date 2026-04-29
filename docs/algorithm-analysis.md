# 树形布局算法技术分析报告

## 1. 引言

树形结构是计算机科学中最常见的数据组织方式之一。从文件系统的目录层级，到组织架构图的汇报关系，从思维导图的发散思考，到决策树的逻辑推演，树形结构无处不在。然而，如何将一棵抽象的树形数据结构自动转化为美观、紧凑、易读的二维布局，是一个持续了近半个世纪的算法研究课题。

树形布局算法的核心挑战在于：在满足一系列美学规则（aesthetic rules）的同时，保持线性时间复杂度。这些美学规则看似简单——节点不重叠、边不交叉、父节点居中于子节点之上——但同时满足所有规则的高效算法直到 2014 年才由 van der Ploeg 完整给出。

本报告将系统梳理树形布局算法的演进历程，深入分析 Non-Layered Tidy Tree 算法的核心原理，探讨五种布局策略的实现方式，并总结本项目采用的优化策略。

## 2. 经典算法演进

### 2.1 Wetherell-Shannon (1979)

Wetherell 和 Shannon 在 1979 年提出了首个 O(n) 时间复杂度的树形布局算法。该算法采用简单的两遍遍历：第一遍自底向上计算每个节点的相对位置，第二遍自顶向下将相对位置转换为绝对坐标。

然而，该算法存在一个根本性缺陷：它无法保证"相同子树产生相同绘制"（subtree consistency）的美学规则。具体而言，一棵子树的绘制形状可能因其在父节点中的位置不同而发生变化，这违背了人类对"一致性"的直觉认知。

### 2.2 Reingold-Tilford (1981)

Reingold 和 Tilford 在 1981 年提出了划时代的改进——轮廓线方法（contour method）。核心思想是：当两棵相邻子树需要合并时，沿着左子树的右轮廓和右子树的左轮廓同步下行，找到最小间距使两棵子树不重叠。

该算法保持了 O(n) 的时间复杂度，并满足了包括子树一致性在内的多项美学规则。但它有一个重要限制：仅支持二叉树（binary tree）。对于多叉树（general tree），需要额外的处理策略。

### 2.3 Walker (1990)

Walker 在 1990 年将 Reingold-Tilford 算法扩展到了一般的多叉树（n-ary tree）。其核心改进在于：当一个新的子树被放置后，不仅需要与其直接左邻兄弟对齐，还需要检查与所有更远的左侧兄弟是否存在重叠。

然而，Walker 的实现存在一个隐蔽的性能缺陷。在调整子树间距时，算法需要将间距均匀分配给中间的所有子树，这个分配过程在最坏情况下退化为 O(n²)。考虑一棵高度为 h 的退化树，每层只有一个节点向右偏移，间距分配将在每层重复执行，总复杂度达到 O(n²)。

### 2.4 Buchheim et al. (2002)

Buchheim、Jünger 和 Leipert 在 2002 年巧妙地修正了 Walker 算法的性能问题。关键创新是引入了两个延迟累加变量：

- **shiftAcceleration**：记录间距分配的加速度
- **shiftChange**：记录间距分配的变化量

通过这两个变量，原本需要 O(k) 遍历中间子树来分配间距的操作被压缩为 O(1) 的常数时间计算。在第二遍遍历（secondWalk）中，通过 `addChildSpacing()` 函数一次性将延迟的间距分配应用到所有子节点上。

Buchheim 算法恢复了 O(n) 的时间复杂度，成为分层布局（layered layout）的标准实现。但它仍然要求同一深度的节点对齐在同一水平线上（分层约束），这在节点尺寸差异较大时会导致大量空间浪费。

### 2.5 算法演进小结

| 算法              | 年份 | 时间复杂度 | 支持树类型 | 是否分层 | 关键贡献          |
| ----------------- | ---- | ---------- | ---------- | -------- | ----------------- |
| Wetherell-Shannon | 1979 | O(n)       | 一般树     | 是       | 首个线性算法      |
| Reingold-Tilford  | 1981 | O(n)       | 二叉树     | 是       | 轮廓线方法        |
| Walker            | 1990 | O(n²) 最坏 | 一般树     | 是       | 扩展到多叉树      |
| Buchheim et al.   | 2002 | O(n)       | 一般树     | 是       | O(1) 间距分配     |
| van der Ploeg     | 2014 | O(n)       | 一般树     | 否       | 非分层 + 线性时间 |

## 3. Non-Layered Tidy Tree 算法详解

### 3.1 七条美学规则

van der Ploeg 在 2014 年的论文 "Drawing Non-layered Tidy Trees in Linear Time" 中定义了七条美学规则，这些规则是判断树形布局质量的核心标准：

1. **无重叠**（No Overlap）：任意两个节点的绘制区域不相交
2. **无交叉**（No Crossing）：连接父子节点的边不相互交叉
3. **子节点对齐**（Children Alignment）：同一父节点的子节点在垂直方向上紧密相连
4. **父节点居中**（Parent Centering）：父节点位于其所有子节点的水平中点
5. **子树一致性**（Subtree Consistency）：结构相同的子树无论出现在树的哪个位置，其内部布局完全相同
6. **顺序保持**（Order Preservation）：子节点在布局方向上的顺序与其在数据结构中的顺序一致
7. **镜像对称**（Mirror Symmetry）：一棵树及其镜像应产生互为镜像的布局结果

规则 7 是所有规则中最难满足的。朴素的从左到右累加布局无法同时满足规则 5 和规则 7。当一棵小子树被夹在两棵大子树之间时，如果简单地"靠左对齐"，则镜像后的布局不是原布局的镜像。

### 3.2 分层 vs 非分层

**分层布局**（Layered Layout）要求同一深度的节点对齐在同一水平线上。每层的高度由该层中最高的节点决定。这种方式便于比较节点的深度层级，但当节点尺寸差异较大时，矮小节点所在的层会因为最高节点而被"撑开"，导致大量空白区域。

**非分层布局**（Non-Layered Layout）取消了这一约束。每个节点的垂直位置仅取决于其父节点的位置加上父节点自身的高度。这意味着节点紧密排列，空间利用率显著提高。

非分层布局在思维导图、组织架构图等节点尺寸不一的场景中尤为适用。但非分层布局的算法难度更大——节点间的碰撞检测不能再简单地按层进行，需要基于实际的 y 坐标范围来判断。

### 3.3 核心概念

#### 3.3.1 轮廓线（Contour）

轮廓线是子树外形的单调链表表示。对每棵子树，维护两条轮廓：

- **左轮廓**（Left Contour）：从根出发，在每个深度取最左侧的节点
- **右轮廓**（Right Contour）：从根出发，在每个深度取最右侧的节点

当两棵相邻子树需要确定间距时，算法沿左子树的右轮廓和右子树的左轮廓同步下行，在每个重叠的 y 坐标范围内计算所需的最小偏移量。

#### 3.3.2 线程指针（Thread）

线程指针是轮廓遍历的加速结构。当一棵子树的轮廓在某个深度"断开"（即该方向上的子节点已经耗尽），线程指针将其连接到该深度上相应的节点，避免回溯查找。

每个节点维护两个线程指针：

- `threadLeft`：左轮廓的下一个节点
- `threadRight`：右轮廓的下一个节点

线程指针使轮廓遍历保持 O(1) 的跳转效率，是算法达到线性时间复杂度的关键。

#### 3.3.3 IYL 索引列表（Index-Y-Level List）

IYL 是 van der Ploeg 算法的核心创新之一。在非分层布局中，碰撞检测需要知道"在某个 y 坐标范围内，哪棵子树是最近的左邻居"。

IYL 是一个按 y 坐标排序的链表，每个节点记录：

- `lowY`：该段 y 坐标范围的下界
- `index`：对应的子树索引
- `next`：指向下一个 IYL 节点

当处理一棵新的子树时，通过 IYL 链表可以 O(1) 定位到在当前 y 坐标范围内的碰撞源子树，无需遍历所有已布局的兄弟子树。

#### 3.3.4 极值节点（Extreme Nodes）

极值节点记录每棵子树在左右两个方向上深度最大的节点。具体包含：

- `el`（extreme left）：子树左轮廓上 y 坐标最大的节点
- `er`（extreme right）：子树右轮廓上 y 坐标最大的节点
- `msel` / `mser`：对应的 mod 累加值

极值节点的作用是：当两棵子树合并后，需要设置新的线程指针，将较浅子树的极值节点连接到较深子树的相应位置。极值节点避免了遍历整棵子树来找到最深叶节点的开销。

### 3.4 两遍遍历

#### 3.4.1 firstWalk（后序遍历）

firstWalk 采用后序遍历（post-order traversal），自底向上处理每个节点：

```
firstWalk(t):
  if t 是叶节点:
    setExtremes(t)  // 叶节点的极值就是自身
    return

  for each child c of t:
    firstWalk(c)
    separate(t, childIndex, ih)  // 与已布局的兄弟子树做碰撞检测

  positionRoot(t)   // 父节点居中于子节点
  setExtremes(t)    // 更新极值节点
```

对于内部节点，算法从左到右依次处理子节点。每放置一个新子节点后，调用 `separate()` 检查新子树是否与已布局的子树发生碰撞，并计算所需的最小偏移量。

#### 3.4.2 separate() 碰撞检测

separate 是算法最核心的函数。它同步遍历两棵子树的轮廓线：

```
separate(t, i, ih):
  sr = 左子树的右轮廓起点
  cl = 右子树（第 i 个子节点）的左轮廓起点

  while sr 和 cl 都不为空:
    if sr 和 cl 在 y 方向上有重叠:
      dist = sr.x + sr.width - cl.x  // 需要的偏移量
      if dist > 0:
        moveSubtree(t, i, ih中对应的源子树, dist)

    // 沿轮廓下行：选择 y+height 较小的一侧前进
    if bottomOf(sr) <= bottomOf(cl):
      sr = nextOnRightContour(sr)
    if bottomOf(cl) <= bottomOf(sr):
      cl = nextOnLeftContour(cl)

  // 设置线程指针连接较浅子树的极值节点到较深子树
  if sr 为空 and cl 不为空:
    setLeftThread(t, i, cl, modsumcl)
  if cl 为空 and sr 不为空:
    setRightThread(t, i, sr, modsumsr)
```

#### 3.4.3 secondWalk（前序遍历）

secondWalk 采用前序遍历（pre-order traversal），自顶向下将相对坐标转换为绝对坐标：

```
secondWalk(t, modsum, isHorizontal):
  addChildSpacing(t)  // 应用延迟的 O(1) 间距分配

  if isHorizontal:
    t.x = t.y坐标（深度方向）
    t.y = prelim + modsum
  else:
    t.x = prelim + modsum
    t.y = y坐标（深度方向）

  for each child c of t:
    secondWalk(c, modsum + c.mod, isHorizontal)
```

### 3.5 O(1) 间距分配

当 `moveSubtree()` 移动一棵子树时，不仅要移动目标子树，还需要将中间的兄弟子树均匀分配间距。朴素实现需要 O(k) 遍历中间子树。

Buchheim 的创新是引入两个延迟变量：

```
moveSubtree(t, i, si, dist):
  子树[i].mod += dist
  子树[i].prelim += dist
  子树[i].shift += dist
  子树[i].change -= dist / (i - si)
  子树[si].change += dist / (i - si)
```

在 `addChildSpacing()` 中，通过前缀和一次性应用：

```
addChildSpacing(t):
  d = 0, modsumdelta = 0
  for i from 0 to t.children.length - 1:
    d += children[i].shift
    modsumdelta += d + children[i].change
    children[i].prelim += modsumdelta
    children[i].mod += modsumdelta
```

这一技巧将间距分配的总时间从 O(n²) 降低到 O(n)。

### 3.6 基于 y 坐标的碰撞检测

非分层布局的关键区别在于：碰撞检测不能简单地按"层"进行。两个节点是否可能发生碰撞，取决于它们在 y 方向（深度方向）上的范围是否重叠。

算法通过 IYL 链表维护每个 y 坐标范围对应的"最近左邻子树索引"。当新子树的左轮廓节点位于某个 y 范围时，IYL 直接给出应该与哪棵子树的右轮廓做碰撞检测。

```
updateIYL(lowY, index, ih):
  // 移除所有 lowY >= 当前 lowY 的旧条目（被新子树"覆盖"）
  while ih ≠ null and lowY >= ih.lowY:
    ih = ih.next
  return new IYL(lowY, index, ih)
```

这确保了即使在非分层的情况下，碰撞检测的总时间仍为 O(n)。

## 4. 五种布局策略分析

本项目实现五种布局策略，它们共享同一套核心算法，仅在坐标变换上有所不同。

### 4.1 水平方向布局

**RightLogical（右展开）**：树根在最左侧，子节点向右展开。这是核心算法在水平模式（`isHorizontal = true`）下的直接输出。在水平模式中，算法的"深度方向"对应 x 轴，"兄弟排列方向"对应 y 轴。

```
rightLogical(root):
  nonLayeredTidyTree(root, isHorizontal=true)
```

**LeftLogical（左展开）**：树根在最右侧，子节点向左展开。实现方式是先按 RightLogical 布局，然后对所有节点的 x 坐标做镜像翻转。

```
leftLogical(root):
  nonLayeredTidyTree(root, isHorizontal=true)
  mirrorX(root)  // x = left + (width - (x - left) - nodeWidth)
```

### 4.2 垂直方向布局

**Downward（下展开）**：树根在最上方，子节点向下展开。这是核心算法在垂直模式（`isHorizontal = false`）下的直接输出。

```
downward(root):
  nonLayeredTidyTree(root, isHorizontal=false)
```

**Upward（上展开）**：树根在最下方，子节点向上展开。实现方式是先按 Downward 布局，然后对所有节点的 y 坐标做镜像翻转。

```
upward(root):
  nonLayeredTidyTree(root, isHorizontal=false)
  mirrorY(root)  // y = top + (height - (y - top) - nodeHeight)
```

### 4.3 Standard 双向布局

**Standard（标准思维导图）**：根节点居中，子节点分布在左右两侧。这是思维导图工具（如 XMind）最常用的布局方式。

实现步骤：

1. **子树平衡拆分**：遍历根节点的所有子节点，计算每个子树的总高度（递归 bounding box）。从第一个子节点开始累加高度，当累计超过总高度的一半时，该位置作为拆分点。拆分点之前的子节点分配给右侧，之后的分配给左侧。
2. **分别布局**：右侧子节点以 RightLogical 方式布局，左侧子节点同样以 RightLogical 方式布局。
3. **左树镜像**：将左侧子树的布局结果做 x 轴镜像翻转。
4. **对齐合并**：调整两侧子树相对于根节点的位置，使根节点在水平方向上居中。

```
standard(root):
  heights = [getSubtreeHeight(c) for c in root.children]
  total = sum(heights)

  // 按高度平衡拆分
  cumulative = 0, splitIndex = length
  for i in 0..length:
    cumulative += heights[i]
    if cumulative >= total / 2:
      splitIndex = i + 1
      break

  rightChildren = children[0..splitIndex]
  leftChildren = children[splitIndex..]

  // 构建临时子树并分别布局
  rightRoot = tempRoot(rightChildren) → rightLogical
  leftRoot = tempRoot(leftChildren) → rightLogical → mirrorX

  // 合并对齐
  alignAndMerge(root, rightRoot, leftRoot)
```

按子树高度而非简单的索引平分，可以得到视觉上更平衡的布局结果。

## 5. 优化策略

### 5.1 消除 WrappedTree 中间结构

原始 mindmap-layouts 实现在布局过程中创建了 `WrappedTree` 包装对象，将算法状态（prelim、mod、shift、change 等）存储在包装对象中。这导致：

- 每次布局需要创建 N 个包装对象
- 布局后需要将坐标从包装对象拷贝回原始节点
- 增量重布局需要重新创建包装对象

本项目采用 `WeakMap<TidyNode, AlgoState>` 替代 WrappedTree：

- 算法状态存储在 WeakMap 中，不污染节点对象
- 布局直接修改 TidyNode 的 x/y 坐标，零拷贝
- WeakMap 在布局结束后可被自然垃圾回收
- 增量重布局无需额外的对象创建/拷贝

### 5.2 Standard 布局子树高度平衡拆分

原始实现按子节点索引简单平分（前半给右侧，后半给左侧）。这在子树尺寸不均匀时导致明显的视觉不平衡——一侧可能拥有大量节点而另一侧只有少量节点。

改进方案：递归计算每棵子树的 bounding box 高度，基于累积高度找到使两侧面积最接近的拆分点。

### 5.3 增量重布局（Partial Relayout）

在交互式编辑场景（如思维导图编辑器）中，用户频繁地折叠/展开节点、添加/删除子节点。每次变更后执行全量重布局在大型树上可能超过 16ms 的帧预算。

增量重布局的核心思想：只重新布局受影响的部分。

```
relayout(changedNode, layoutFn):
  node = changedNode
  while node.parent:
    清除 node.parent 所有子节点极值节点上的线程指针
    重新运行 layoutSubtree(node.parent, children)
    node = node.parent
  应用 secondWalk 计算绝对坐标
```

时间复杂度为 O(d + m)，其中 d 为变更节点的深度，m 为受影响的可见节点数。相比全量重布局的 O(n)，在大型树上有显著的性能优势。

### 5.4 Bug 修复清单

从 mindmap-layouts 移植过程中发现并修复了以下问题：

| #   | Bug 描述                | 原因                                                    | 修复方式                                               |
| --- | ----------------------- | ------------------------------------------------------- | ------------------------------------------------------ |
| 1   | `getEdges()` 丢失部分边 | `edges.concat(extraEdges)` 返回新数组但未赋值给 `edges` | 使用展开运算符 `[...edges, ...extraEdges]` 或直接 push |
| 2   | `eachNode()` O(n²) 内存 | 每次迭代用 `nodes = children.concat(nodes)` 创建新数组  | 改为 `for (const child of children) nodes.push(child)` |
| 3   | `countByDepth` 死代码   | 变量计算后从未被使用                                    | 直接移除                                               |
| 4   | Standard 布局子树不平衡 | 按索引平分而非按子树高度拆分                            | 改为基于子树高度的累积拆分                             |

## 6. 复杂度对比表

| 维度           | 原始 mindmap-layouts      | 本项目实现             |
| -------------- | ------------------------- | ---------------------- |
| 全量布局时间   | O(n)                      | O(n)                   |
| 增量重布局时间 | 不支持                    | O(d + m)               |
| 布局空间       | O(n) 额外（WrappedTree）  | O(n) WeakMap（可回收） |
| eachNode 遍历  | O(n²) 内存分配            | O(n) 原地栈操作        |
| getEdges       | O(n²) 最坏（concat bug）  | O(n) 正确实现          |
| Standard 拆分  | 索引平分（O(1) 但不平衡） | 高度平衡拆分 O(n)      |
| 类型安全       | JavaScript，无类型        | TypeScript strict 模式 |
| 节点尺寸       | 分层约束                  | 非分层，任意尺寸       |

其中 n 为树的节点总数，d 为变更节点的深度，m 为增量重布局影响的节点数。

---

**参考文献**

1. Wetherell, C. & Shannon, A. (1979). "Tidy Drawings of Trees." _IEEE Transactions on Software Engineering._
2. Reingold, E. M. & Tilford, J. S. (1981). "Tidier Drawings of Trees." _IEEE Transactions on Software Engineering._
3. Walker, J. Q. II (1990). "A Node-Positioning Algorithm for General Trees." _Software: Practice and Experience._
4. Buchheim, C., Jünger, M. & Leipert, S. (2002). "Improving Walker's Algorithm to Run in Linear Time." _Graph Drawing._
5. van der Ploeg, A. (2014). "Drawing Non-layered Tidy Trees in Linear Time." _Software: Practice and Experience._
6. 曾名希 (zxch3n). "Non-layered Tidy Tree 介绍." https://www.zxch3n.com/tidy/tidy/
