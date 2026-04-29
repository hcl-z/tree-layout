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
