import type { TidyNode } from "../node.ts";

export function relayout(changedNode: TidyNode, layoutFn: (root: TidyNode) => TidyNode): TidyNode {
  let root = changedNode;
  while (root.parent) root = root.parent;
  return layoutFn(root);
}
