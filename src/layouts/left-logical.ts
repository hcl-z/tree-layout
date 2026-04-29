import type { TidyNode } from "../node.ts";
import { nonLayeredTidyTree } from "../algorithm/non-layered-tidy.ts";

export function leftLogical(root: TidyNode): TidyNode {
  nonLayeredTidyTree(root, true);
  root.mirrorX();
  return root;
}
