import { useCallback, useRef } from "react";
import { useReactFlow } from "@xyflow/react";
import { toPng } from "html-to-image";
import { useMindMapState, useMindMapDispatch, type LayoutType } from "../store";

const LAYOUTS: { value: LayoutType; label: string }[] = [
  { value: "standard", label: "思维导图" },
  { value: "rightLogical", label: "向右展开" },
  { value: "leftLogical", label: "向左展开" },
  { value: "downward", label: "向下展开" },
  { value: "upward", label: "向上展开" },
];

export function Toolbar() {
  const state = useMindMapState();
  const dispatch = useMindMapDispatch();
  const { fitView } = useReactFlow();
  const importRef = useRef<HTMLInputElement>(null);

  const handleExportJson = useCallback(() => {
    const blob = new Blob([JSON.stringify(state.data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "mindmap.json";
    a.click();
    URL.revokeObjectURL(url);
  }, [state.data]);

  const handleImportJson = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const data = JSON.parse(reader.result as string);
          dispatch({ type: "IMPORT_DATA", data });
          setTimeout(() => fitView({ padding: 0.2 }), 100);
        } catch {
          alert("无效的 JSON 文件");
        }
      };
      reader.readAsText(file);
      e.target.value = "";
    },
    [dispatch, fitView],
  );

  const handleExportPng = useCallback(() => {
    const viewport = document.querySelector(".react-flow__viewport") as HTMLElement;
    if (!viewport) return;
    toPng(viewport, {
      backgroundColor: "#0a0a0a",
      filter: (node) =>
        !node.classList?.contains("react-flow__minimap") &&
        !node.classList?.contains("react-flow__controls"),
    }).then((dataUrl) => {
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = "mindmap.png";
      a.click();
    });
  }, []);

  const handleLayoutChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      dispatch({
        type: "SET_LAYOUT",
        layoutType: e.target.value as LayoutType,
      });
      setTimeout(() => fitView({ padding: 0.2 }), 350);
    },
    [dispatch, fitView],
  );

  return (
    <div className="toolbar">
      <div className="toolbar-group">
        <label>布局：</label>
        <select value={state.layoutType} onChange={handleLayoutChange}>
          {LAYOUTS.map((l) => (
            <option key={l.value} value={l.value}>
              {l.label}
            </option>
          ))}
        </select>
      </div>

      <div className="toolbar-divider" />

      <button
        className="toolbar-btn"
        onClick={() =>
          state.selectedId && dispatch({ type: "ADD_CHILD", parentId: state.selectedId })
        }
        disabled={!state.selectedId}
        title="添加子节点 (Tab)"
      >
        + 子节点
      </button>
      <button
        className="toolbar-btn"
        onClick={() =>
          state.selectedId && dispatch({ type: "DELETE_NODE", nodeId: state.selectedId })
        }
        disabled={!state.selectedId || state.selectedId === state.data.id}
        title="删除 (Delete)"
      >
        删除
      </button>

      <div className="toolbar-divider" />

      <button
        className="toolbar-btn"
        onClick={() => dispatch({ type: "UNDO" })}
        disabled={state.history.length === 0}
        title="撤销 (Ctrl+Z)"
      >
        ↩ 撤销
      </button>
      <button
        className="toolbar-btn"
        onClick={() => dispatch({ type: "REDO" })}
        disabled={state.future.length === 0}
        title="重做 (Ctrl+Shift+Z)"
      >
        重做 ↪
      </button>

      <div className="toolbar-divider" />

      <button className="toolbar-btn" onClick={handleExportJson} title="导出 JSON">
        导出 JSON
      </button>
      <button className="toolbar-btn" onClick={() => importRef.current?.click()} title="导入 JSON">
        导入 JSON
      </button>
      <button className="toolbar-btn" onClick={handleExportPng} title="导出 PNG">
        导出 PNG
      </button>
      <input ref={importRef} type="file" accept=".json" onChange={handleImportJson} hidden />

      <div className="toolbar-spacer" />
      <span className="toolbar-hint">
        Tab: 添加子节点 · Enter: 添加兄弟 · Delete: 删除 · Space: 折叠
      </span>
    </div>
  );
}
