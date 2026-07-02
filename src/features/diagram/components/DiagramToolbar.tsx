"use client";

import { Button } from "@/components/ui/button";
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  RotateCcw,
  Download,
  ImageDown,
  Copy,
  Check,
  Expand,
  Shrink,
} from "lucide-react";

interface DiagramToolbarProps {
  scale: number;
  copied: boolean;
  isFullscreen: boolean;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetView: () => void;
  onFitToScreen: () => void;
  onDownloadSVG: () => void;
  onDownloadPNG: () => void;
  onCopyDefinition: () => void;
  onToggleFullscreen: () => void;
}

export function DiagramToolbar({
  scale,
  copied,
  isFullscreen,
  onZoomIn,
  onZoomOut,
  onResetView,
  onFitToScreen,
  onDownloadSVG,
  onDownloadPNG,
  onCopyDefinition,
  onToggleFullscreen,
}: DiagramToolbarProps) {
  return (
    <div className="absolute top-2 right-2 z-10 flex items-center gap-1 rounded-md border bg-background/80 p-1 backdrop-blur-sm shadow-sm">
      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onZoomIn} title="Zoom in  (+)" aria-label="Zoom in">
        <ZoomIn className="h-4 w-4" />
      </Button>
      <button
        type="button"
        className="min-w-12 text-center text-xs tabular-nums text-muted-foreground select-none hover:text-foreground transition-colors"
        title="Click to reset zoom (0)"
        onClick={onResetView}
        aria-label="Reset zoom to 100%"
      >
        {Math.round(scale * 100)}%
      </button>
      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onZoomOut} title="Zoom out  (-)" aria-label="Zoom out">
        <ZoomOut className="h-4 w-4" />
      </Button>
      <div className="mx-1 h-4 w-px bg-border" />
      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onFitToScreen} title="Fit to screen  (F)" aria-label="Fit to screen">
        <Maximize2 className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onResetView} title="Reset view  (0)" aria-label="Reset view">
        <RotateCcw className="h-4 w-4" />
      </Button>
      <div className="mx-1 h-4 w-px bg-border" />
      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onDownloadSVG} title="Download SVG" aria-label="Download SVG">
        <Download className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onDownloadPNG} title="Download PNG" aria-label="Download PNG">
        <ImageDown className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onCopyDefinition} title="Copy Mermaid source" aria-label="Copy Mermaid source">
        {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
      </Button>
      <div className="mx-1 h-4 w-px bg-border" />
      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onToggleFullscreen} title={isFullscreen ? "Exit fullscreen" : "Fullscreen"} aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}>
        {isFullscreen ? <Shrink className="h-4 w-4" /> : <Expand className="h-4 w-4" />}
      </Button>
    </div>
  );
}
