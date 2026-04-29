import type { TidyNode } from "../node.ts";
import { nonLayeredTidyTree } from "../algorithm/non-layered-tidy.ts";

export function upward(root: TidyNode): TidyNode {
  nonLayeredTidyTree(root, false);
  root.mirrorY();
  return root;
}
