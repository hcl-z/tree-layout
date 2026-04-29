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
  const half = total / 2;
  let cum = 0;
  let bestIndex = 1;
  let bestDiff = Infinity;
  for (let i = 0; i < allChildren.length; i++) {
    cum += heights[i]!;
    const idx = i + 1;
    if (idx >= 1 && idx <= allChildren.length - 1) {
      const diff = Math.abs(cum - half);
      if (diff < bestDiff) {
        bestDiff = diff;
        bestIndex = idx;
      }
    }
  }
  const splitIndex = bestIndex;

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
      n.x = n.x - leftRootX;
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

  const rootCenterY = root.y + root.height / 2;
  const rightShiftY = rootCenterY - rightCenterY;
  if (rightShiftY !== 0) {
    for (const c of rightChildren)
      c.eachNode((n) => {
        n.y += rightShiftY;
      });
  }
  const leftShiftY = rootCenterY - leftCenterY;
  if (leftShiftY !== 0) {
    for (const c of leftChildren)
      c.eachNode((n) => {
        n.y += leftShiftY;
      });
  }

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
