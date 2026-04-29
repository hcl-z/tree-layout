### Tech Stack

- **Language:** TypeScript (strict mode, ESNext target)
- **Runtime:** Node.js
- **Toolchain:** Vite+ (`vp` CLI) — wraps tsdown (bundling), vitest (testing), oxlint (linting), oxfmt (formatting)
- **Package manager:** pnpm 10.x (workspace)
- **Module format:** ESM (`"type": "module"`)
- **Type generation:** tsgo (native TypeScript compiler preview)

### Directory Structure

```
src/
├── index.ts                    — 公开 API 导出
├── types.ts                    — InputNode, LayoutOptions, NodeInfo, Edge, BoundingBox
├── node.ts                     — TidyNode 类、createTree、getNodes、getEdges、getBoundingBox
├── algorithm/
│   ├── non-layered-tidy.ts     — 核心 Non-Layered Tidy Tree 算法 (WeakMap 方案)
│   └── partial-relayout.ts     — 增量重布局接口
└── layouts/
    ├── right-logical.ts        — 右展开
    ├── left-logical.ts         — 左展开（镜像）
    ├── downward.ts             — 下展开
    ├── upward.ts               — 上展开（镜像）
    └── standard.ts             — 标准双向 mindmap（子树高度平衡拆分）

tests/                          — 45 个测试（node、algorithm、layouts、index）
docs/algorithm-analysis.md      — 技术分析报告
examples/playground/            — Canvas 2D 交互式 Playground（pnpm workspace 成员）
dist/                           — 构建产物 (index.mjs + index.d.mts)
```

### Key Design Decisions

- **WeakMap 替代 WrappedTree**：算法临时状态（prelim、mod、shift、change、线程指针、极值节点）通过 `WeakMap<TidyNode, AlgoState>` 管理，不污染节点对象，零拷贝
- **纯函数式布局 API**：5 个布局函数接收 TidyNode 树，原地修改坐标
- **水平/垂直统一处理**：通过 `isHorizontal` 标志在算法入口交换宽高和 x/y 语义
- **Standard 布局平衡拆分**：按子树高度累积而非索引平分
- Single entry point (`src/index.ts` → `dist/index.mjs`)
- Playground 作为 pnpm workspace 成员，依赖 `tree-layout: workspace:*`
