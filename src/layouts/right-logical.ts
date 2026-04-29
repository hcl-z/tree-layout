import type { TidyNode } from "../node.ts";
import { nonLayeredTidyTree } from "../algorithm/non-layered-tidy.ts";

export function rightLogical(root: TidyNode): TidyNode {
  return nonLayeredTidyTree(root, true);
}
