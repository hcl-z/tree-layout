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
