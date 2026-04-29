# tree-layout

A TypeScript library implementing 5 tree layout algorithms based on the Non-Layered Tidy Tree algorithm (van der Ploeg, 2014). Zero dependencies, O(n) time complexity, supports variable-size nodes.

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

## Incremental Relayout

```typescript
import { relayout } from "tree-layout";

node.data.collapsed = true;
relayout(node, layout.downward);
```

## Development

```bash
pnpm install        # install dependencies
vp test             # run tests
vp check            # lint + type check
vp pack             # build
```

## Playground

```bash
cd examples/playground
pnpm dev
```

Interactive Canvas 2D demo with layout switching, sample datasets, pan/zoom, and node collapse.

## License

MIT
