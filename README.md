# tree-layout

A TypeScript library implementing 5 tree layout algorithms based on the Non-Layered Tidy Tree algorithm (van der Ploeg, 2014). Zero dependencies, O(n) time complexity, supports variable-size nodes.

[**Live Playground →**](https://tree-layout-blue.vercel.app/)

## Install

```bash
pnpm add tree-layout
```

## Usage

```typescript
import { createTree, layout, getNodes, getEdges, getBoundingBox } from "tree-layout";

const data = {
  id: "root",
  width: 80,
  height: 40,
  children: [
    { id: "a", width: 60, height: 30 },
    {
      id: "b",
      width: 60,
      height: 30,
      children: [
        { id: "b1", width: 50, height: 25 },
        { id: "b2", width: 50, height: 25 },
      ],
    },
  ],
};

const root = createTree(data);
layout.downward(root);

const nodes = getNodes(root); // [{ id, x, y, width, height, ... }]
const edges = getEdges(root); // [{ source, target }]
const bb = getBoundingBox(root); // { left, top, width, height }
```

## Layout Strategies

| Layout                      | Description                                        |
| --------------------------- | -------------------------------------------------- |
| `layout.rightLogical(root)` | Root on the left, children expand right            |
| `layout.leftLogical(root)`  | Root on the right, children expand left            |
| `layout.downward(root)`     | Root on top, children expand downward              |
| `layout.upward(root)`       | Root on bottom, children expand upward             |
| `layout.standard(root)`     | Root centered, children split left/right (mindmap) |

## API

### `createTree(data, options?)`

Build a `TidyNode` tree from input data.

```typescript
interface InputNode {
  id?: string;
  width?: number;
  height?: number;
  children?: InputNode[];
  collapsed?: boolean;
}

interface LayoutOptions {
  getId?: (data: InputNode) => string;
  getWidth?: (data: InputNode) => number;
  getHeight?: (data: InputNode) => number;
  getHGap?: (data: InputNode) => number;
  getVGap?: (data: InputNode) => number;
}
```

### `relayout(node, layoutFn)`

Incremental relayout after toggling `collapsed`.

```typescript
import { relayout } from "tree-layout";

node.data.collapsed = true;
relayout(node, layout.downward);
```

### Utilities

- `getNodes(root)` — flat array of `NodeInfo` with computed `x`, `y`, `centerX`, `centerY`
- `getEdges(root)` — array of `{ source, target }` edges
- `getBoundingBox(root)` — `{ left, top, width, height }`

## Development

```bash
pnpm install        # install dependencies
vp test             # run tests (45 tests)
vp check            # lint + type check
vp pack             # build
```

## Playground

```bash
cd example/playground
pnpm dev
```

Interactive Canvas 2D demo with layout switching, node count slider, H/V gap controls, pan/zoom, and node collapse/expand.

## References

- A. van der Ploeg, "Drawing Non-layered Tidy Trees in Linear Time" (2014)
- [zxch3n/tidy](https://github.com/zxch3n/tidy) — Rust/WASM implementation
- [leungwensen/mindmap-layouts](https://github.com/leungwensen/mindmap-layouts) — Original JS layouts

## License

MIT
