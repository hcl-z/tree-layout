import { useMemo, useCallback, useEffect } from "react";
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  BackgroundVariant,
  type NodeMouseHandler,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { MindMapProvider, useMindMapState, useMindMapDispatch } from "./store";
import { computeLayout } from "./layout";
import { MindMapNode } from "./nodes/MindMapNode";
import { MindMapEdge } from "./edges/MindMapEdge";
import { Toolbar } from "./components/Toolbar";

const nodeTypes = { mindmap: MindMapNode };
const edgeTypes = { mindmap: MindMapEdge };

function MindMapCanvas() {
  const state = useMindMapState();
  const dispatch = useMindMapDispatch();

  const { nodes, edges } = useMemo(
    () => computeLayout(state.data, state.layoutType),
    [state.data, state.layoutType],
  );

  const onEditConfirm = useCallback(
    (id: string, name: string) => {
      if (name.trim()) dispatch({ type: "EDIT_NODE", nodeId: id, name: name.trim() });
      else dispatch({ type: "SET_EDITING", nodeId: null });
    },
    [dispatch],
  );

  const onEditCancel = useCallback(() => {
    dispatch({ type: "SET_EDITING", nodeId: null });
  }, [dispatch]);

  const nodesWithState = useMemo(
    () =>
      nodes.map((n) => ({
        ...n,
        selected: n.id === state.selectedId,
        data: {
          ...n.data,
          onEditConfirm,
          onEditCancel,
        },
      })),
    [nodes, state.selectedId, onEditConfirm, onEditCancel],
  );

  const onNodeClick: NodeMouseHandler = useCallback(
    (_event, node) => {
      const target = _event.target as HTMLElement;
      if (target.closest(".collapse-btn")) {
        dispatch({ type: "TOGGLE_COLLAPSE", nodeId: node.id });
      } else {
        dispatch({ type: "SET_SELECTED", nodeId: node.id });
      }
    },
    [dispatch],
  );

  const onPaneClick = useCallback(() => {
    dispatch({ type: "SET_SELECTED", nodeId: null });
  }, [dispatch]);

  // Keyboard shortcuts
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (state.editingId) return;

      const id = state.selectedId;
      if (!id) return;

      switch (e.key) {
        case "Tab":
          e.preventDefault();
          dispatch({ type: "ADD_CHILD", parentId: id });
          break;
        case "Enter":
          e.preventDefault();
          dispatch({ type: "ADD_SIBLING", nodeId: id });
          break;
        case "Delete":
        case "Backspace":
          e.preventDefault();
          dispatch({ type: "DELETE_NODE", nodeId: id });
          break;
        case " ":
          e.preventDefault();
          dispatch({ type: "TOGGLE_COLLAPSE", nodeId: id });
          break;
        case "F2":
          e.preventDefault();
          dispatch({ type: "SET_EDITING", nodeId: id });
          break;
        case "Escape":
          dispatch({ type: "SET_SELECTED", nodeId: null });
          break;
        case "z":
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            if (e.shiftKey) dispatch({ type: "REDO" });
            else dispatch({ type: "UNDO" });
          }
          break;
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [state.selectedId, state.editingId, dispatch]);

  // LocalStorage persistence
  useEffect(() => {
    try {
      localStorage.setItem("mindmap-data", JSON.stringify(state.data));
    } catch {}
  }, [state.data]);

  return (
    <div className="app">
      <ReactFlow
        nodes={nodesWithState}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        nodesDraggable={false}
        nodesConnectable={false}
        zoomOnDoubleClick={false}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.05}
        maxZoom={4}
        proOptions={{ hideAttribution: true }}
      >
        <Background variant={BackgroundVariant.Dots} color="#333" gap={20} />
        <Controls showInteractive={false} />
        <MiniMap
          nodeColor={(n) => ((n.data as Record<string, unknown>).branchColor as string) ?? "#666"}
          maskColor="rgba(0,0,0,0.7)"
          style={{ background: "#1a1a1a" }}
        />
        <Toolbar />
      </ReactFlow>
    </div>
  );
}

export function App() {
  return (
    <MindMapProvider>
      <MindMapCanvas />
    </MindMapProvider>
  );
}
