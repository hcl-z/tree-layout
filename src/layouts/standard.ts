import { TidyNode } from "../node.ts";
import { nonLayeredTidyTree } from "../algorithm/non-layered-tidy.ts";

export function standard(root: TidyNode): TidyNode {
  if (root.children.length === 0) {
    root.x = 0;
    root.y = 0;
    return root;
  }

  if (root.children.length === 1) {
    nonLayeredTidyTree(root, true);
    return root;
  }

  const allChildren = root.children;

  const heights = allChildren.map((child) => computeSubtreeSpan(child));
  const total = heights.reduce((a, b) => a + b, 0);
  let cum = 0;
  let splitIndex = allChildren.length;
  for (let i = 0; i < heights.length; i++) {
    cum += heights[i]!;
    if (cum >= total / 2) {
      splitIndex = i + 1;
      break;
    }
  }
  splitIndex = Math.max(1, Math.min(splitIndex, allChildren.length - 1));

  const rightChildren = allChildren.slice(0, splitIndex);
  const leftChildren = allChildren.slice(splitIndex);

  const rightRoot = makeTempRoot(root, rightChildren);
  nonLayeredTidyTree(rightRoot, true);

  const leftRoot = makeTempRoot(root, leftChildren);
  nonLayeredTidyTree(leftRoot, true);
  leftRoot.mirrorX();

  const rrBB = rightRoot.getBoundingBox();
  const rightRootY = rightRoot.y;
  for (const c of rightChildren) {
    c.eachNode((n) => {
      n.x = n.x - rrBB.left;
      n.y = n.y - rightRootY;
    });
  }

  const leftRootX = leftRoot.x;
  const leftRootY = leftRoot.y;
  for (const c of leftChildren) {
    c.eachNode((n) => {
      n.x = n.x - (leftRootX + leftRoot.width);
      n.y = n.y - leftRootY;
    });
  }

  let rightMinY = Infinity;
  let rightMaxY = -Infinity;
  for (const c of rightChildren) {
    c.eachNode((n) => {
      rightMinY = Math.min(rightMinY, n.y);
      rightMaxY = Math.max(rightMaxY, n.y + n.height);
    });
  }

  let leftMinY = Infinity;
  let leftMaxY = -Infinity;
  for (const c of leftChildren) {
    c.eachNode((n) => {
      leftMinY = Math.min(leftMinY, n.y);
      leftMaxY = Math.max(leftMaxY, n.y + n.height);
    });
  }

  const rightCenterY = (rightMinY + rightMaxY) / 2;
  const leftCenterY = (leftMinY + leftMaxY) / 2;
  const centerY = Math.max(rightCenterY, leftCenterY);

  root.x = 0;
  root.y = centerY - root.height / 2;

  for (const c of rightChildren) c.parent = root;
  for (const c of leftChildren) c.parent = root;
  root.children = [...rightChildren, ...leftChildren];

  const bb = root.getBoundingBox();
  root.translate(-bb.left, -bb.top);

  return root;
}

function makeTempRoot(original: TidyNode, children: TidyNode[]): TidyNode {
  const temp = new TidyNode(
    original.data,
    original.id + "_tmp",
    original.actualWidth,
    original.actualHeight,
    original.hgap,
    original.vgap,
    0,
    null,
  );
  temp.children = children;
  for (const c of children) c.parent = temp;
  return temp;
}

function computeSubtreeSpan(node: TidyNode): number {
  let count = 0;
  node.eachNode(() => {
    count++;
  });
  return count * node.height;
}
