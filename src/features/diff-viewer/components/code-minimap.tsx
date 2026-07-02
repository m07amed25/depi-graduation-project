"use client";

import React, { useMemo, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { ParsedLine } from "./diff-algorithm";

interface CodeMinimapProps {
  lines: ParsedLine[];
  visibleStart: number;
  visibleEnd: number;
  totalLines: number;
  onLineClick: (lineIndex: number) => void;
  className?: string;
}

export function CodeMinimap({
  lines,
  visibleStart,
  visibleEnd,
  totalLines,
  onLineClick,
  className,
}: CodeMinimapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const lineHeight = useMemo(() => {
    return Math.max(1, Math.min(3, 300 / totalLines));
  }, [totalLines]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const width = 80;
    const height = totalLines * lineHeight;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);

    // Clear canvas
    ctx.fillStyle = "rgb(17, 24, 39)"; // dark bg
    ctx.fillRect(0, 0, width, height);

    // Draw lines
    lines.forEach((line, idx) => {
      const y = idx * lineHeight;
      let color = "rgb(55, 65, 81)"; // context line (gray)

      if (line.type === "addition") {
        color = "rgb(34, 197, 94)"; // green for additions
      } else if (line.type === "deletion") {
        color = "rgb(239, 68, 68)"; // red for deletions
      }

      ctx.fillStyle = color;
      ctx.fillRect(0, y, width, lineHeight);
    });

    // Draw visible viewport indicator
    const visibleStartY = visibleStart * lineHeight;
    const visibleHeight = (visibleEnd - visibleStart) * lineHeight;
    ctx.strokeStyle = "rgba(59, 130, 246, 0.8)"; // blue
    ctx.lineWidth = 2;
    ctx.strokeRect(0, visibleStartY, width, visibleHeight);
    ctx.fillStyle = "rgba(59, 130, 246, 0.1)";
    ctx.fillRect(0, visibleStartY, width, visibleHeight);
  }, [lines, visibleStart, visibleEnd, totalLines, lineHeight]);

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const lineIndex = Math.floor((y / rect.height) * totalLines);
    onLineClick(Math.max(0, Math.min(lineIndex, totalLines - 1)));
  };

  return (
    <div
      ref={containerRef}
      className={cn(
        "flex flex-col border-l border-border/50 bg-muted/20",
        "hidden lg:flex sticky top-0 h-screen overflow-hidden",
        className,
      )}
    >
      <div className="px-2 py-2 border-b border-border/50 bg-card/80">
        <p className="font-mono text-xs font-medium text-muted-foreground">
          Minimap
        </p>
      </div>
      <div className="flex-1 overflow-auto scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
        {/* imageRendering CSS property not available in Tailwind - inline style required */}
        <canvas
          ref={canvasRef}
          onClick={handleClick}
          className="cursor-pointer w-full"
          style={{ imageRendering: "pixelated" }}
        />
      </div>
      <div className="px-2 py-1.5 border-t border-border/50 bg-card/80">
        <p className="font-mono text-xs text-muted-foreground text-center">
          {totalLines} lines
        </p>
      </div>
    </div>
  );
}
