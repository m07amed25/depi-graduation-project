"use client";

import "@xyflow/react/dist/style.css";
import { type CSSProperties, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Panel,
  Handle,
  Position,
  BaseEdge,
  getSmoothStepPath,
  getStraightPath,
  getNodesBounds,
  useNodesState,
  useEdgesState,
  useReactFlow,
  useNodesInitialized,
  useInternalNode,
  type Node,
  type Edge,
  type NodeProps,
  type EdgeProps,
  type InternalNode,
} from "@xyflow/react";
import Dagre from "@dagrejs/dagre";
import { toPng } from "html-to-image";
import { Download, KeyRound, Link2, Table2, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type {
  DiagramNode,
  DiagramEdge,
  DiagramNodeDetailTable,
} from "@/features/diagram/types";
import { NodeInfoPanel } from "./node-info-panel";

const NODE_W = 240;
const HEADER_H = 38;
const ROW_H = 24;

const colsOf = (n: DiagramNode) =>
  (n.detail as DiagramNodeDetailTable)?.columns ?? [];

function rowCount(n: DiagramNode): number {
  return colsOf(n).length;
}
const nodeHeightFor = (n: DiagramNode) => HEADER_H + rowCount(n) * ROW_H;

/** Layered layout via dagre — minimises edge crossings. */
function layout(items: DiagramNode[], edges: DiagramEdge[]) {
  const g = new Dagre.graphlib.Graph();
  g.setGraph({ rankdir: "TB", nodesep: 48, ranksep: 160, marginx: 40, marginy: 40 });
  g.setDefaultEdgeLabel(() => ({}));
  const ids = new Set(items.map((n) => n.id));
  items.forEach((n) => g.setNode(n.id, { width: NODE_W, height: nodeHeightFor(n) }));
  edges.forEach((e) => {
    if (ids.has(e.fromId) && ids.has(e.toId)) g.setEdge(e.fromId, e.toId);
  });
  Dagre.layout(g);
  const pos = new Map<string, { x: number; y: number }>();
  items.forEach((n) => {
    const d = g.node(n.id);
    pos.set(n.id, { x: d.x - NODE_W / 2, y: d.y - nodeHeightFor(n) / 2 });
  });
  return pos;
}


function intersection(node: InternalNode, other: InternalNode) {
  const w = (node.measured.width ?? 0) / 2;
  const h = (node.measured.height ?? 0) / 2;
  const x2 = node.internals.positionAbsolute.x + w;
  const y2 = node.internals.positionAbsolute.y + h;
  const x1 = other.internals.positionAbsolute.x + (other.measured.width ?? 0) / 2;
  const y1 = other.internals.positionAbsolute.y + (other.measured.height ?? 0) / 2;
  const xx = (x1 - x2) / (2 * w) - (y1 - y2) / (2 * h);
  const yy = (x1 - x2) / (2 * w) + (y1 - y2) / (2 * h);
  const a = 1 / (Math.abs(xx) + Math.abs(yy) || 1);
  return { x: w * (a * xx + a * yy) + x2, y: h * (-a * xx + a * yy) + y2 };
}

function borderSide(node: InternalNode, p: { x: number; y: number }) {
  const nx = node.internals.positionAbsolute.x;
  const ny = node.internals.positionAbsolute.y;
  if (p.x <= nx + 1) return Position.Left;
  if (p.x >= nx + (node.measured.width ?? 0) - 1) return Position.Right;
  if (p.y <= ny + 1) return Position.Top;
  return Position.Bottom;
}

function FloatingEdge({ id, source, target, style, data }: EdgeProps) {
  const s = useInternalNode(source);
  const t = useInternalNode(target);
  if (!s?.measured?.width || !t?.measured?.width) return null;
  const sp = intersection(s, t);
  const tp = intersection(t, s);
  const d = data as
    | { label?: string; markerStart?: string; markerEnd?: string; straight?: boolean }
    | undefined;
  const [path, labelX, labelY] = d?.straight
    ? getStraightPath({ sourceX: sp.x, sourceY: sp.y, targetX: tp.x, targetY: tp.y })
    : getSmoothStepPath({
        sourceX: sp.x,
        sourceY: sp.y,
        sourcePosition: borderSide(s, sp),
        targetX: tp.x,
        targetY: tp.y,
        targetPosition: borderSide(t, tp),
        borderRadius: 12,
      });
  return (
    <BaseEdge
      id={id}
      path={path}
      markerStart={d?.markerStart}
      markerEnd={d?.markerEnd}
      style={style}
      label={d?.label}
      labelX={labelX}
      labelY={labelY}
      labelStyle={{ fill: "oklch(0.84 0.03 255)", fontSize: 10, fontWeight: 600 }}
      labelShowBg
      labelBgStyle={{ fill: "oklch(0.15 0.02 255)", fillOpacity: 0.92 }}
      labelBgPadding={[6, 3]}
      labelBgBorderRadius={4}
    />
  );
}

/** Canonical UML relationship markers (hollow triangle, diamonds, open arrow). */
const UML_PURPLE = "oklch(0.68 0.16 300)";
const UML_TEAL = "oklch(0.72 0.13 195)";
const UML_GRAY = "oklch(0.62 0.05 255)";
const UML_FILL = "oklch(0.13 0.02 250)"; // canvas bg → makes hollow markers opaque

function UmlMarkers() {
  return (
    <svg style={{ position: "absolute", width: 0, height: 0 }} aria-hidden>
      <defs>
        {/* Generalization / realization → hollow triangle at target */}
        <marker id="uml-tri" markerWidth="20" markerHeight="20" refX="17" refY="6" orient="auto-start-reverse" markerUnits="userSpaceOnUse">
          <path d="M1,1 L17,6 L1,11 z" fill={UML_FILL} stroke={UML_PURPLE} strokeWidth="1.4" />
        </marker>
        {/* Composition → filled diamond at owner */}
        <marker id="uml-diamond-filled" markerWidth="24" markerHeight="14" refX="1" refY="6" orient="auto-start-reverse" markerUnits="userSpaceOnUse">
          <path d="M1,6 L11,1 L21,6 L11,11 z" fill={UML_TEAL} stroke={UML_TEAL} strokeWidth="1" />
        </marker>
        {/* Aggregation → hollow diamond at owner */}
        <marker id="uml-diamond-hollow" markerWidth="24" markerHeight="14" refX="1" refY="6" orient="auto-start-reverse" markerUnits="userSpaceOnUse">
          <path d="M1,6 L11,1 L21,6 L11,11 z" fill={UML_FILL} stroke={UML_TEAL} strokeWidth="1.4" />
        </marker>
        {/* Association / dependency → open arrow at target */}
        <marker id="uml-arrow" markerWidth="16" markerHeight="16" refX="9" refY="5" orient="auto-start-reverse" markerUnits="userSpaceOnUse">
          <path d="M1,1 L9,5 L1,9" fill="none" stroke={UML_GRAY} strokeWidth="1.4" />
        </marker>
        {/* ERD relations → filled arrow at target (preserves prior ERD look) */}
        <marker id="uml-arrow-filled" markerWidth="16" markerHeight="16" refX="9" refY="5" orient="auto-start-reverse" markerUnits="userSpaceOnUse">
          <path d="M1,1 L10,5 L1,9 z" fill={UML_GRAY} stroke={UML_GRAY} strokeWidth="1" />
        </marker>
      </defs>
    </svg>
  );
}

/** Maps a UML relationship to its marker ends, line style and colour. */
function umlEdgeStyle(direction: DiagramEdge["direction"]) {
  switch (direction) {
    case "INHERITS":
      return { color: UML_PURPLE, dashed: false, markerEnd: "url(#uml-tri)", markerStart: undefined };
    case "IMPLEMENTS":
      return { color: UML_PURPLE, dashed: true, markerEnd: "url(#uml-tri)", markerStart: undefined };
    case "COMPOSES":
      return { color: UML_TEAL, dashed: false, markerEnd: undefined, markerStart: "url(#uml-diamond-filled)" };
    case "AGGREGATES":
      return { color: UML_TEAL, dashed: false, markerEnd: undefined, markerStart: "url(#uml-diamond-hollow)" };
    case "DEPENDS":
      return { color: UML_GRAY, dashed: true, markerEnd: "url(#uml-arrow)", markerStart: undefined };
    case "INCLUDES":
    case "EXTENDS":
      return { color: UML_GRAY, dashed: true, markerEnd: "url(#uml-arrow)", markerStart: undefined };
    case "ONE_TO_ONE":
    case "ONE_TO_MANY":
    case "MANY_TO_MANY":
      return { color: UML_GRAY, dashed: false, markerEnd: "url(#uml-arrow-filled)", markerStart: undefined };
    default: // ASSOCIATES → plain UML association line
      return { color: UML_GRAY, dashed: false, markerEnd: undefined, markerStart: undefined };
  }
}

const edgeTypes = { floating: FloatingEdge };

/** Frames the dagre-arranged graph once nodes are measured, and re-fits on regenerate. */
function AutoFit({ dep }: { dep: string }) {
  const initialized = useNodesInitialized();
  const { fitView } = useReactFlow();
  useEffect(() => {
    if (initialized) void fitView({ padding: 0.2, duration: 300 });
  }, [initialized, dep, fitView]);
  return null;
}

function TableNode({ data, selected }: NodeProps) {
  const node = (data as { node: DiagramNode }).node;
  const columns = colsOf(node);
  return (
    <div
      style={{ width: NODE_W }}
      className={cn(
        "overflow-hidden rounded-lg border bg-[oklch(0.16_0.02_255)] shadow-xl transition-all hover:shadow-2xl",
        selected
          ? "border-[oklch(0.70_0.15_255)] ring-2 ring-[oklch(0.62_0.16_250)]/50"
          : "border-[oklch(0.34_0.03_255)] hover:border-[oklch(0.46_0.06_255)]",
      )}
    >
      <Handle type="target" position={Position.Left} className="!h-1.5 !w-1.5 !border-0 !bg-transparent" />
      <Handle type="source" position={Position.Right} className="!h-1.5 !w-1.5 !border-0 !bg-transparent" />
      <div
        style={{ height: HEADER_H }}
        className="flex items-center gap-2 bg-gradient-to-r from-[oklch(0.31_0.10_265)] to-[oklch(0.24_0.06_265)] px-3"
      >
        <Table2 className="size-3.5 shrink-0 text-[oklch(0.86_0.10_265)]" />
        <span className="flex-1 truncate text-[13px] font-semibold tracking-wide text-[oklch(0.96_0.02_265)]">
          {node.label}
        </span>
        <span className="shrink-0 text-[10px] font-medium text-[oklch(0.72_0.05_265)]">
          {columns.length}
        </span>
      </div>
      <div>
        {columns.map((c) => (
          <div
            key={c.name}
            style={{ height: ROW_H }}
            className={cn(
              "flex items-center gap-2 border-t border-[oklch(0.23_0.02_255)] px-3 text-[11px] transition-colors hover:bg-[oklch(0.23_0.03_265)]",
              c.isPrimaryKey && "bg-[oklch(0.21_0.04_265)]",
            )}
          >
            <span className="flex w-3.5 shrink-0 justify-center">
              {c.isPrimaryKey ? (
                <KeyRound className="size-3 text-[oklch(0.82_0.13_85)]" />
              ) : c.isForeignKey ? (
                <Link2 className="size-3 text-[oklch(0.70_0.12_250)]" />
              ) : null}
            </span>
            <span
              className={cn(
                "flex-1 truncate font-mono text-[oklch(0.87_0.02_255)]",
                c.isPrimaryKey && "font-semibold",
              )}
            >
              {c.name}
            </span>
            <span className="shrink-0 font-mono text-[10px] uppercase tracking-wide text-[oklch(0.58_0.04_255)]">
              {c.type}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

const nodeTypes = {
  erdTable: TableNode,
};

const btnBase =
  "flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium shadow-sm transition-colors";
const arrangeBtn = cn(
  btnBase,
  "bg-[oklch(0.62_0.16_255)] font-semibold text-[oklch(0.15_0.03_255)] hover:bg-[oklch(0.69_0.16_255)]",
);
const exportBtn = cn(
  btnBase,
  "border border-[oklch(0.34_0.03_255)] bg-[oklch(0.18_0.02_255)] text-[oklch(0.86_0.02_255)] hover:border-[oklch(0.52_0.12_255)] hover:bg-[oklch(0.24_0.03_255)] hover:text-white",
);

// Dark-theme the React Flow zoom/fit control buttons (white by default).
const controlsStyle = {
  "--xy-controls-button-background-color": "oklch(0.17 0.02 250)",
  "--xy-controls-button-background-color-hover": "oklch(0.26 0.05 255)",
  "--xy-controls-button-color": "oklch(0.82 0.02 250)",
  "--xy-controls-button-color-hover": "oklch(0.96 0.02 255)",
  "--xy-controls-button-border-color": "oklch(0.26 0.02 250)",
} as CSSProperties;

/** Toolbar: auto-arrange + watermarked PNG export. */
function Toolbar({ onArrange }: { onArrange: () => void }) {
  const { getNodes } = useReactFlow();

  const onExport = useCallback(() => {
    const nodes = getNodes();
    const viewport = document.querySelector<HTMLElement>(".react-flow__viewport");
    if (!nodes.length || !viewport) return;
    const bounds = getNodesBounds(nodes);
    const pad = 48;
    const w = Math.ceil(bounds.width + pad * 2);
    const h = Math.ceil(bounds.height + pad * 2);
    // Keep the output within browser canvas limits (huge schemas otherwise throw).
    const ratio = Math.min(2, 8000 / Math.max(w, h));

    void toPng(viewport, {
      backgroundColor: "#0c1018",
      width: w,
      height: h,
      pixelRatio: ratio,
      skipFonts: true,
      style: {
        width: `${w}px`,
        height: `${h}px`,
        transform: `translate(${pad - bounds.x}px, ${pad - bounds.y}px) scale(1)`,
      },
    })
      .then((dataUrl) => {
        const base = new Image();
        base.onload = () => {
          const canvas = document.createElement("canvas");
          canvas.width = base.width;
          canvas.height = base.height;
          const ctx = canvas.getContext("2d");
          if (!ctx) return;
          ctx.drawImage(base, 0, 0);
          const save = () => {
            const a = document.createElement("a");
            a.href = canvas.toDataURL("image/png");
            a.download = "diagram.png";
            a.click();
          };
          const logo = new Image();
          logo.onload = () => {
            const lw = Math.min(base.width * 0.16, 240);
            const lh = (logo.height / logo.width) * lw;
            const m = base.width * 0.02;
            ctx.globalAlpha = 0.55;
            ctx.drawImage(logo, base.width - lw - m, base.height - lh - m, lw, lh);
            ctx.globalAlpha = 1;
            save();
          };
          logo.onerror = save;
          logo.src = "/logo-noback.png";
        };
        base.src = dataUrl;
      })
      .catch((err) => {
        console.error("ERD export failed", err);
        toast.error("Could not export the diagram as an image.");
      });
  }, [getNodes]);

  return (
    <Panel position="top-right" className="flex gap-2">
      <button type="button" onClick={onArrange} title="Auto-arrange tables" className={arrangeBtn}>
        <Wand2 className="size-3.5" />
        Arrange
      </button>
      <button type="button" onClick={onExport} title="Export as PNG" className={exportBtn}>
        <Download className="size-3.5" />
        PNG
      </button>
    </Panel>
  );
}

export default function DiagramFlow({
  nodes,
  edges,
}: {
  nodes: DiagramNode[];
  edges: DiagramEdge[];
}) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [selected, setSelected] = useState<DiagramNode | null>(null);

  const items = useMemo(
    () => nodes.filter((n) => n.type === "TABLE"),
    [nodes],
  );

  const sig = useMemo(() => items.map((n) => n.id).join("|"), [items]);

  const { initialNodes, initialEdges } = useMemo(() => {
    const ids = new Set(items.map((n) => n.id));
    const mkEdges = (): Edge[] =>
      edges
        .filter((e) => ids.has(e.fromId) && ids.has(e.toId))
        .map((e, i) => {
          const u = umlEdgeStyle(e.direction);
          return {
            id: `e${i}`,
            source: e.fromId,
            target: e.toId,
            type: "floating",
            data: { label: e.label, markerStart: u.markerStart, markerEnd: u.markerEnd, straight: false },
            style: { stroke: u.color, strokeWidth: 1.5, strokeDasharray: u.dashed ? "6 4" : undefined },
          };
        });

    const pos = layout(items, edges);
    const initialNodes: Node[] = items.map((n) => ({
      id: n.id,
      type: "erdTable",
      position: pos.get(n.id) ?? { x: 0, y: 0 },
      data: { node: n },
    }));
    return { initialNodes, initialEdges: mkEdges() };
  }, [items, edges]);

  // Stateful nodes/edges — required so dragging actually moves tables.
  const [rfNodes, setRfNodes, onNodesChange] = useNodesState(initialNodes);
  const [rfEdges, setRfEdges, onEdgesChange] = useEdgesState(initialEdges);
  useEffect(() => {
    setRfNodes(initialNodes);
    setRfEdges(initialEdges);
  }, [initialNodes, initialEdges, setRfNodes, setRfEdges]);

  const onArrange = useCallback(() => {
    const pos = layout(items, edges);
    setRfNodes((nds) =>
      nds.map((n) => ({ ...n, position: pos.get(n.id) ?? n.position })),
    );
  }, [items, edges, setRfNodes]);

  return (
    <div
      ref={wrapperRef}
      className="relative w-full overflow-hidden rounded-md border border-[oklch(0.24_0.02_250)] bg-[oklch(0.13_0.02_250)]"
      style={{ height: 600 }}
    >
      <UmlMarkers />
      <ReactFlow
        nodes={rfNodes}
        edges={rfEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.1}
        maxZoom={2.5}
        nodesDraggable
        elementsSelectable
        zoomOnScroll
        zoomOnPinch
        zoomOnDoubleClick
        panOnDrag
        nodeDragThreshold={1}
        nodesConnectable={false}
        onNodeClick={(_, n) => {
          const nd = (n.data as { node?: DiagramNode }).node;
          if (nd) setSelected(nd);
        }}
      >
        <Background gap={22} color="oklch(0.22 0.02 250)" />
        <AutoFit dep={sig} />
        <Toolbar onArrange={onArrange} />
        <MiniMap
          pannable
          zoomable
          nodeColor="oklch(0.30 0.05 255)"
          nodeStrokeColor="oklch(0.62 0.16 250)"
          nodeStrokeWidth={3}
          nodeBorderRadius={4}
          maskColor="oklch(0.10 0.02 250 / 0.6)"
          className="!rounded-md !border !border-[oklch(0.28_0.02_250)] overflow-hidden"
          style={{ background: "oklch(0.10 0.02 250)" }}
        />
        <Controls showInteractive={false} style={controlsStyle} />
      </ReactFlow>
      <NodeInfoPanel
        node={selected}
        onClose={() => setSelected(null)}
        excludeRef={wrapperRef}
      />
    </div>
  );
}
