import { memo, useCallback } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { useMindMapState, useMindMapDispatch } from "../store";

export interface MindMapNodeData {
  label: string;
  width: number;
  height: number;
  isRoot: boolean;
  depth: number;
  branchColor: string;
  collapsed: boolean;
  descendantCount: number;
  hasChildren: boolean;
  layoutType: string;
  onEditConfirm: (id: string, name: string) => void;
  onEditCancel: () => void;
  [key: string]: unknown;
}

function MindMapNodeComponent({ id, data, selected }: NodeProps) {
  const d = data as unknown as MindMapNodeData;
  const { editingId } = useMindMapState();
  const dispatch = useMindMapDispatch();
  const isEditing = editingId === id;

  const handleDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      dispatch({ type: "SET_EDITING", nodeId: id });
    },
    [id, dispatch],
  );

  return (
    <div
      className={`mindmap-node ${d.isRoot ? "root" : ""} ${selected ? "selected" : ""} ${isEditing ? "editing" : ""}`}
      onDoubleClick={handleDoubleClick}
      style={{
        width: d.width,
        height: d.height,
        borderColor: selected ? "#fff" : d.branchColor,
        background: d.isRoot ? d.branchColor : `${d.branchColor}18`,
      }}
    >
      <Handle
        type="source"
        position={Position.Right}
        id="source-right"
        className="mindmap-handle"
      />
      <Handle type="source" position={Position.Left} id="source-left" className="mindmap-handle" />
      <Handle type="source" position={Position.Top} id="source-top" className="mindmap-handle" />
      <Handle
        type="source"
        position={Position.Bottom}
        id="source-bottom"
        className="mindmap-handle"
      />
      <Handle
        type="target"
        position={Position.Right}
        id="target-right"
        className="mindmap-handle"
      />
      <Handle type="target" position={Position.Left} id="target-left" className="mindmap-handle" />
      <Handle type="target" position={Position.Top} id="target-top" className="mindmap-handle" />
      <Handle
        type="target"
        position={Position.Bottom}
        id="target-bottom"
        className="mindmap-handle"
      />

      {isEditing ? (
        <input
          className="mindmap-node-input"
          defaultValue={d.label}
          autoFocus
          onBlur={(e) => d.onEditConfirm(id, e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") d.onEditConfirm(id, (e.target as HTMLInputElement).value);
            if (e.key === "Escape") d.onEditCancel();
          }}
          onClick={(e) => e.stopPropagation()}
          style={{
            fontSize: d.isRoot ? 18 : 14,
            width: d.width - 24,
            color: d.isRoot ? "#fff" : "#e0e0e0",
          }}
        />
      ) : (
        <span
          className="mindmap-node-label"
          style={{
            fontSize: d.isRoot ? 18 : 14,
            color: d.isRoot ? "#fff" : "#e0e0e0",
          }}
        >
          {d.label}
        </span>
      )}

      {d.hasChildren && (
        <div className="collapse-btn" style={{ background: d.branchColor }}>
          {d.collapsed ? `+${d.descendantCount}` : "−"}
        </div>
      )}
    </div>
  );
}

export const MindMapNode = memo(MindMapNodeComponent);
