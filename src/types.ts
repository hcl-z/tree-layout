export interface InputNode {
  id?: string;
  name?: string;
  width?: number;
  height?: number;
  children?: InputNode[];
  collapsed?: boolean;
  [key: string]: unknown;
}

export interface LayoutOptions {
  getId?: (data: InputNode) => string;
  getWidth?: (data: InputNode) => number;
  getHeight?: (data: InputNode) => number;
  getHGap?: (data: InputNode) => number;
  getVGap?: (data: InputNode) => number;
}

export interface NodeInfo {
  data: InputNode;
  id: string;
  x: number;
  y: number;
  centerX: number;
  centerY: number;
  width: number;
  height: number;
  actualWidth: number;
  actualHeight: number;
  hgap: number;
  vgap: number;
  depth: number;
}

export interface Edge {
  source: string;
  target: string;
}

export interface BoundingBox {
  left: number;
  top: number;
  width: number;
  height: number;
}
