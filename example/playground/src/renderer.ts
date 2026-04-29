import type { TidyNode } from "auto-tree-layout";

export class Renderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private offsetX = 50;
  private offsetY = 80;
  private scale = 1;
  private dragging = false;
  private lastX = 0;
  private lastY = 0;
  private root: TidyNode | null = null;
  private isHorizontal = false;
  onClickNode: ((node: TidyNode) => void) | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d")!;
    this.setupEvents();
    this.resize();
    window.addEventListener("resize", () => this.resize());
  }

  private resize(): void {
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = window.innerWidth * dpr;
    this.canvas.height = window.innerHeight * dpr;
    this.canvas.style.width = `${window.innerWidth}px`;
    this.canvas.style.height = `${window.innerHeight}px`;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  private setupEvents(): void {
    this.canvas.addEventListener("mousedown", (e) => {
      this.dragging = true;
      this.lastX = e.clientX;
      this.lastY = e.clientY;
    });
    window.addEventListener("mousemove", (e) => {
      if (!this.dragging) return;
      this.offsetX += e.clientX - this.lastX;
      this.offsetY += e.clientY - this.lastY;
      this.lastX = e.clientX;
      this.lastY = e.clientY;
    });
    window.addEventListener("mouseup", () => {
      this.dragging = false;
    });
    this.canvas.addEventListener(
      "wheel",
      (e) => {
        e.preventDefault();
        const factor = e.deltaY > 0 ? 0.9 : 1.1;
        const newScale = Math.max(0.05, Math.min(8, this.scale * factor));
        const mx = e.clientX,
          my = e.clientY;
        this.offsetX = mx - (mx - this.offsetX) * (newScale / this.scale);
        this.offsetY = my - (my - this.offsetY) * (newScale / this.scale);
        this.scale = newScale;
      },
      { passive: false },
    );
    this.canvas.addEventListener("click", (e) => {
      if (!this.root || !this.onClickNode) return;
      const mx = (e.clientX - this.offsetX) / this.scale;
      const my = (e.clientY - this.offsetY) / this.scale;
      this.root.eachNode((n) => {
        const nx = n.x + n.hgap;
        const ny = n.y + n.vgap;
        if (mx >= nx && mx <= nx + n.actualWidth && my >= ny && my <= ny + n.actualHeight) {
          this.onClickNode!(n);
        }
      });
    });
  }

  setRoot(root: TidyNode, isHorizontal: boolean): void {
    this.root = root;
    this.isHorizontal = isHorizontal;
  }

  fitToView(): void {
    if (!this.root) return;
    const bb = this.root.getBoundingBox();
    const padding = 50;
    const topBar = 50;
    const vw = window.innerWidth - padding * 2;
    const vh = window.innerHeight - topBar - padding * 2;
    const sx = vw / (bb.width || 1);
    const sy = vh / (bb.height || 1);
    this.scale = Math.min(sx, sy, 5);
    this.offsetX = padding + (vw - bb.width * this.scale) / 2 - bb.left * this.scale;
    this.offsetY = topBar + padding + (vh - bb.height * this.scale) / 2 - bb.top * this.scale;
  }

  render(): void {
    const { ctx, canvas } = this;
    const w = canvas.width / (window.devicePixelRatio || 1);
    const h = canvas.height / (window.devicePixelRatio || 1);
    ctx.clearRect(0, 0, w, h);
    if (!this.root) return;

    ctx.save();
    ctx.translate(this.offsetX, this.offsetY);
    ctx.scale(this.scale, this.scale);

    this.root.eachNode((node) => {
      for (const child of node.children) {
        this.drawEdge(ctx, node, child);
      }
    });

    this.root.eachNode((node) => {
      this.drawNode(ctx, node);
    });

    ctx.restore();
  }

  private drawEdge(ctx: CanvasRenderingContext2D, parent: TidyNode, child: TidyNode): void {
    ctx.beginPath();
    ctx.strokeStyle = "rgba(238, 238, 238, 0.8)";
    ctx.lineWidth = 1;

    const pnx = parent.x + parent.hgap;
    const pny = parent.y + parent.vgap;
    const cnx = child.x + child.hgap;
    const cny = child.y + child.vgap;

    if (this.isHorizontal) {
      const px = pnx + parent.actualWidth;
      const py = pny + parent.actualHeight / 2;
      const cx = cnx;
      const cy = cny + child.actualHeight / 2;
      const midX = (px + cx) / 2;
      ctx.moveTo(px, py);
      ctx.bezierCurveTo(midX, py, midX, cy, cx, cy);
    } else {
      const px = pnx + parent.actualWidth / 2;
      const py = pny + parent.actualHeight;
      const cx = cnx + child.actualWidth / 2;
      const cy = cny;
      const midY = (py + cy) / 2;
      ctx.moveTo(px, py);
      ctx.bezierCurveTo(px, midY, cx, midY, cx, cy);
    }

    ctx.stroke();
  }

  private drawNode(ctx: CanvasRenderingContext2D, node: TidyNode): void {
    const x = node.x + node.hgap;
    const y = node.y + node.vgap;
    const nw = node.actualWidth;
    const nh = node.actualHeight;
    const r = Math.min(8, nw / 4, nh / 4);

    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + nw - r, y);
    ctx.quadraticCurveTo(x + nw, y, x + nw, y + r);
    ctx.lineTo(x + nw, y + nh - r);
    ctx.quadraticCurveTo(x + nw, y + nh, x + nw - r, y + nh);
    ctx.lineTo(x + r, y + nh);
    ctx.quadraticCurveTo(x, y + nh, x, y + nh - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();

    ctx.fillStyle = "#4a4bd2";
    ctx.fill();

    const hasCollapsedChildren =
      node.data.children && node.data.children.length > 0 && node.children.length === 0;

    if ((node.collapsed || hasCollapsedChildren) && this.scale > 0.15) {
      ctx.fillStyle = "rgba(255,255,255,0.8)";
      ctx.font = "bold 10px system-ui";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("+", x + nw - 6, y + 6);
    }
  }
}
