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
