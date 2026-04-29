import type { InputNode } from "tree-layout";

export const smallTree: InputNode = {
  id: "root",
  width: 50,
  height: 50,
  children: [
    {
      id: "a",
      width: 25,
      height: 25,
      children: [
        {
          id: "a1",
          width: 30,
          height: 70,
          children: [{ id: "a1x", width: 100, height: 20 }],
        },
      ],
    },
    {
      id: "b",
      width: 60,
      height: 60,
      children: [
        {
          id: "b1",
          width: 30,
          height: 30,
          children: [
            { id: "b1a", width: 25, height: 25 },
            { id: "b1b", width: 25, height: 25 },
            { id: "b1c", width: 25, height: 25 },
          ],
        },
        { id: "b2", width: 25, height: 25 },
        { id: "b3", width: 25, height: 25 },
        {
          id: "b4",
          width: 40,
          height: 30,
          children: [
            {
              id: "b4a",
              width: 25,
              height: 25,
              children: [
                { id: "b4a1", width: 20, height: 20 },
                { id: "b4a2", width: 20, height: 20 },
                { id: "b4a3", width: 20, height: 20 },
              ],
            },
            { id: "b4b", width: 25, height: 25 },
            { id: "b4c", width: 25, height: 25 },
          ],
        },
      ],
    },
    {
      id: "c",
      width: 40,
      height: 40,
      children: [
        {
          id: "c1",
          width: 50,
          height: 50,
          children: [{ id: "c1a", width: 80, height: 20 }],
        },
      ],
    },
  ],
};

const SHAPES = [
  { width: 30, height: 30 },
  { width: 40, height: 40 },
  { width: 50, height: 50 },
  { width: 60, height: 25 },
  { width: 80, height: 20 },
  { width: 25, height: 60 },
  { width: 20, height: 80 },
  { width: 35, height: 35 },
  { width: 45, height: 30 },
  { width: 30, height: 45 },
  { width: 20, height: 20 },
  { width: 55, height: 40 },
];

function randomDim(): { width: number; height: number } {
  return SHAPES[Math.floor(Math.random() * SHAPES.length)]!;
}

export function generateTree(count: number): InputNode {
  let id = 0;
  function build(budget: number, depth: number): InputNode {
    const node: InputNode = { id: `n${id++}`, ...randomDim() };
    if (budget <= 1 || depth > 10) return node;
    const remaining = budget - 1;
    const maxKids = Math.min(remaining, depth === 0 ? 4 : Math.ceil(Math.random() * 5));
    const numKids = Math.max(1, maxKids);
    const children: InputNode[] = [];
    let left = remaining;
    for (let i = 0; i < numKids && left > 0; i++) {
      const isLast = i === numKids - 1;
      const share = isLast
        ? left
        : Math.max(1, Math.ceil((left / (numKids - i)) * (0.3 + Math.random() * 1.4)));
      const childBudget = Math.min(share, left);
      children.push(build(childBudget, depth + 1));
      left -= childBudget;
    }
    if (children.length > 0) node.children = children;
    return node;
  }
  return build(count, 0);
}

export const mediumTree: InputNode = generateTree(50);
export const largeTree: InputNode = generateTree(500);

export const datasets: Record<string, InputNode> = {
  small: smallTree,
  medium: mediumTree,
  large: largeTree,
};
