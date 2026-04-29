import type { TidyNode } from "../node.ts";
import { nonLayeredTidyTree } from "../algorithm/non-layered-tidy.ts";

export function downward(root: TidyNode): TidyNode {
  return nonLayeredTidyTree(root, false);
}
