import { memo } from "react";
import { getBezierPath, BaseEdge, type EdgeProps } from "@xyflow/react";

function MindMapEdgeComponent(props: EdgeProps) {
  const { sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, data } = props;
  const branchColor = ((data as Record<string, unknown>)?.branchColor as string) ?? "#666";

  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
  });

  return <BaseEdge path={edgePath} style={{ stroke: branchColor, strokeWidth: 2 }} />;
}

export const MindMapEdge = memo(MindMapEdgeComponent);
