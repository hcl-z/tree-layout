import { createContext, useContext, useReducer, type Dispatch, type ReactNode } from "react";
import type { InputNode } from "auto-tree-layout";

export type LayoutType = "standard" | "rightLogical" | "leftLogical" | "downward" | "upward";

export interface MindMapState {
  data: InputNode;
  selectedId: string | null;
  editingId: string | null;
  layoutType: LayoutType;
  history: InputNode[];
  future: InputNode[];
}

export type MindMapAction =
  | { type: "ADD_CHILD"; parentId: string }
  | { type: "ADD_SIBLING"; nodeId: string }
  | { type: "DELETE_NODE"; nodeId: string }
  | { type: "EDIT_NODE"; nodeId: string; name: string }
  | { type: "TOGGLE_COLLAPSE"; nodeId: string }
  | { type: "SET_LAYOUT"; layoutType: LayoutType }
  | { type: "SET_SELECTED"; nodeId: string | null }
  | { type: "SET_EDITING"; nodeId: string | null }
  | { type: "IMPORT_DATA"; data: InputNode }
  | { type: "UNDO" }
  | { type: "REDO" };

function cloneTree(node: InputNode): InputNode {
  return JSON.parse(JSON.stringify(node));
}

function generateId(): string {
  return crypto.randomUUID().slice(0, 8);
}

function findNode(root: InputNode, id: string): InputNode | null {
  if (root.id === id) return root;
  for (const child of root.children ?? []) {
    const found = findNode(child, id);
    if (found) return found;
  }
  return null;
}

function findParent(root: InputNode, id: string): InputNode | null {
  for (const child of root.children ?? []) {
    if (child.id === id) return root;
    const found = findParent(child, id);
    if (found) return found;
  }
  return null;
}

export const INITIAL_DATA: InputNode = {
  id: "root",
  name: "中心主题",
  children: [
    {
      id: "b1",
      name: "分支 1",
      children: [
        { id: "b1-1", name: "子主题 1-1" },
        { id: "b1-2", name: "子主题 1-2" },
      ],
    },
    {
      id: "b2",
      name: "分支 2",
      children: [
        { id: "b2-1", name: "子主题 2-1" },
        { id: "b2-2", name: "子主题 2-2" },
      ],
    },
    {
      id: "b3",
      name: "分支 3",
      children: [{ id: "b3-1", name: "子主题 3-1" }],
    },
  ],
};

const MAX_HISTORY = 50;

function pushHistory(state: MindMapState): Pick<MindMapState, "history" | "future"> {
  const history = [...state.history, cloneTree(state.data)];
  if (history.length > MAX_HISTORY) history.shift();
  return { history, future: [] };
}

function reducer(state: MindMapState, action: MindMapAction): MindMapState {
  switch (action.type) {
    case "ADD_CHILD": {
      const data = cloneTree(state.data);
      const parent = findNode(data, action.parentId);
      if (!parent) return state;
      const newId = generateId();
      if (!parent.children) parent.children = [];
      parent.collapsed = false;
      parent.children.push({ id: newId, name: "新主题" });
      return {
        ...state,
        data,
        editingId: newId,
        selectedId: newId,
        ...pushHistory(state),
      };
    }

    case "ADD_SIBLING": {
      const data = cloneTree(state.data);
      if (action.nodeId === data.id) return state;
      const parent = findParent(data, action.nodeId);
      if (!parent?.children) return state;
      const idx = parent.children.findIndex((c) => c.id === action.nodeId);
      if (idx === -1) return state;
      const newId = generateId();
      parent.children.splice(idx + 1, 0, { id: newId, name: "新主题" });
      return {
        ...state,
        data,
        editingId: newId,
        selectedId: newId,
        ...pushHistory(state),
      };
    }

    case "DELETE_NODE": {
      if (action.nodeId === state.data.id) return state;
      const data = cloneTree(state.data);
      const parent = findParent(data, action.nodeId);
      if (!parent?.children) return state;
      parent.children = parent.children.filter((c) => c.id !== action.nodeId);
      return {
        ...state,
        data,
        selectedId: parent.id ?? null,
        editingId: null,
        ...pushHistory(state),
      };
    }

    case "EDIT_NODE": {
      const data = cloneTree(state.data);
      const node = findNode(data, action.nodeId);
      if (!node) return state;
      node.name = action.name;
      return { ...state, data, editingId: null, ...pushHistory(state) };
    }

    case "TOGGLE_COLLAPSE": {
      const data = cloneTree(state.data);
      const node = findNode(data, action.nodeId);
      if (!node || !node.children?.length) return state;
      node.collapsed = !node.collapsed;
      return { ...state, data, ...pushHistory(state) };
    }

    case "SET_LAYOUT":
      return { ...state, layoutType: action.layoutType };

    case "SET_SELECTED":
      return { ...state, selectedId: action.nodeId, editingId: null };

    case "SET_EDITING":
      return { ...state, editingId: action.nodeId };

    case "IMPORT_DATA":
      return {
        ...state,
        data: action.data,
        selectedId: null,
        editingId: null,
        ...pushHistory(state),
      };

    case "UNDO": {
      if (state.history.length === 0) return state;
      const history = [...state.history];
      const prev = history.pop()!;
      return {
        ...state,
        data: prev,
        history,
        future: [cloneTree(state.data), ...state.future],
        selectedId: null,
        editingId: null,
      };
    }

    case "REDO": {
      if (state.future.length === 0) return state;
      const future = [...state.future];
      const next = future.shift()!;
      return {
        ...state,
        data: next,
        future,
        history: [...state.history, cloneTree(state.data)],
        selectedId: null,
        editingId: null,
      };
    }

    default:
      return state;
  }
}

const StateCtx = createContext<MindMapState>(null!);
const DispatchCtx = createContext<Dispatch<MindMapAction>>(null!);

export function useMindMapState() {
  return useContext(StateCtx);
}

export function useMindMapDispatch() {
  return useContext(DispatchCtx);
}

function loadInitialData(): InputNode {
  try {
    const saved = localStorage.getItem("mindmap-data");
    if (saved) return JSON.parse(saved);
  } catch {}
  return INITIAL_DATA;
}

export function MindMapProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, {
    data: loadInitialData(),
    selectedId: null,
    editingId: null,
    layoutType: "standard",
    history: [],
    future: [],
  });

  return (
    <StateCtx value={state}>
      <DispatchCtx value={dispatch}>{children}</DispatchCtx>
    </StateCtx>
  );
}
