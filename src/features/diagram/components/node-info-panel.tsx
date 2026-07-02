"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import type {
  DiagramNode,
  DiagramNodeDetailTable,
} from "@/features/diagram/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { X, Database, GripHorizontal, ArrowRightLeft, Tag } from "lucide-react";

interface NodeInfoPanelProps {
  node: DiagramNode | null;
  onClose: () => void;
  /** Clicks inside this element won't close the panel (e.g. the diagram viewport) */
  excludeRef?: React.RefObject<HTMLElement | null>;
}

const TYPE_CONFIG: Record<
  DiagramNode["type"],
  { label: string; icon: React.ElementType; color: string }
> = {
  TABLE: {
    label: "Table",
    icon: Database,
    color: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  },
};

function TableDetail({ detail }: { detail: DiagramNodeDetailTable }) {
  return (
    <div className="space-y-3">
      {/* Scalar columns */}
      {detail.columns?.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
            Columns
          </p>
          {detail.columns.map((col) => (
            <div
              key={col.name}
              className="flex items-center justify-between text-xs gap-2"
            >
              <span className="font-mono text-muted-foreground">{col.name}</span>
              <div className="flex items-center gap-1">
                {col.isPrimaryKey && (
                  <Badge variant="outline" className="text-[10px] px-1 py-0">
                    PK
                  </Badge>
                )}
                {col.isForeignKey && (
                  <Badge variant="outline" className="text-[10px] px-1 py-0">
                    FK
                  </Badge>
                )}
                <span className="text-muted-foreground/70">{col.type}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Relation fields */}
      {detail.relations && detail.relations.length > 0 && (
        <>
          <Separator />
          <div className="space-y-1.5">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60 flex items-center gap-1">
              <ArrowRightLeft className="size-3" />
              Relations
            </p>
            {detail.relations.map((rel) => (
              <div
                key={rel.name}
                className="flex items-center justify-between text-xs gap-2"
              >
                <span className="font-mono text-muted-foreground">{rel.name}</span>
                <div className="flex items-center gap-1">
                  <Badge
                    variant="secondary"
                    className="text-[10px] px-1 py-0 font-normal"
                  >
                    {rel.isArray ? "[]" : rel.isOptional ? "?" : "1"}
                  </Badge>
                  <span className="text-muted-foreground/70">{rel.targetModel}</span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Model-level attributes (@@unique, @@index, etc.) */}
      {detail.attributes && detail.attributes.length > 0 && (
        <>
          <Separator />
          <div className="space-y-1">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60 flex items-center gap-1">
              <Tag className="size-3" />
              Attributes
            </p>
            {detail.attributes.map((attr, i) => (
              <div key={i} className="text-[11px] font-mono text-muted-foreground/70 break-all">
                {attr}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export function NodeInfoPanel({
  node,
  onClose,
  excludeRef,
}: NodeInfoPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  // Drag state — position relative to the nearest positioned parent
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });

  // Reset position when the selected node changes (derived-state pattern avoids effect)
  const [prevNodeId, setPrevNodeId] = useState(node?.id);
  if (prevNodeId !== node?.id) {
    setPrevNodeId(node?.id);
    setPos(null);
  }

  const handleDragStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    if (!panelRef.current) return;
    const rect = panelRef.current.getBoundingClientRect();
    dragOffset.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    setIsDragging(true);

    const onMove = (ev: MouseEvent) => {
      if (!panelRef.current) return;
      const parent = panelRef.current.offsetParent as HTMLElement | null;
      const parentRect = parent?.getBoundingClientRect() ?? {
        left: 0,
        top: 0,
        width: window.innerWidth,
        height: window.innerHeight,
      };
      const maxX = parentRect.width - panelRef.current.offsetWidth;
      const maxY = parentRect.height - panelRef.current.offsetHeight;
      const x = Math.min(
        Math.max(0, ev.clientX - parentRect.left - dragOffset.current.x),
        maxX,
      );
      const y = Math.min(
        Math.max(0, ev.clientY - parentRect.top - dragOffset.current.y),
        maxY,
      );
      setPos({ x, y });
    };

    const onUp = () => {
      setIsDragging(false);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }, []);

  // Close on Escape key
  useEffect(() => {
    if (!node) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [node, onClose]);

  // Close on outside click — but NOT when clicking inside the diagram viewport
  useEffect(() => {
    if (!node) return;
    const handleClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (panelRef.current?.contains(target)) return;
      if (excludeRef?.current?.contains(target)) return;
      onClose();
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [node, onClose, excludeRef]);

  if (!node) return null;

  const { label, icon: Icon, color } = TYPE_CONFIG[node.type];

  const posStyle = pos ? { left: pos.x, top: pos.y } : { left: 16, top: 16 };

  return (
    <div
      ref={panelRef}
      className="absolute z-50 w-72 shadow-xl animate-in slide-in-from-top-2 fade-in duration-200"
      style={{ ...posStyle, transition: isDragging ? "none" : undefined }}
      role="dialog"
      aria-label={`Node info: ${node.label}`}
    >
      <Card className="border-border/60 bg-background/95 backdrop-blur-md">
        {/* Drag handle */}
        <div
          onMouseDown={handleDragStart}
          className="flex items-center justify-center py-1 cursor-grab active:cursor-grabbing text-muted-foreground/40 hover:text-muted-foreground/70 transition-colors select-none"
          aria-hidden
        >
          <GripHorizontal className="size-4" />
        </div>
        <CardHeader className="flex flex-row items-center justify-between pb-2 pt-0 px-4">
          <div className="flex items-center gap-2 min-w-0">
            <Badge
              variant="outline"
              className={`text-[10px] px-1.5 py-0.5 shrink-0 flex items-center gap-1 ${color}`}
            >
              <Icon className="size-3" />
              {label}
            </Badge>
            <CardTitle className="text-sm truncate font-semibold">
              {node.label}
            </CardTitle>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="size-6 shrink-0 ml-1"
            onClick={onClose}
            aria-label="Close"
          >
            <X className="size-3" />
          </Button>
        </CardHeader>
        <Separator
          className="mx-4 w-auto"
          style={{ width: "calc(100% - 2rem)" }}
        />
        <CardContent className="px-4 pb-4 pt-3 max-h-72 overflow-y-auto">
          {node.type === "TABLE" && node.detail && (
            <TableDetail detail={node.detail as DiagramNodeDetailTable} />
          )}
          {!node.detail && (
            <p className="text-xs text-muted-foreground">
              No additional details.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
