"use client";

import { useEffect, useId, useRef, useState } from "react";

interface MermaidPreviewProps {
  definition: string;
  className?: string;
}

let _initialized = false;

async function getMermaid() {
  const mermaid = (await import("mermaid")).default;
  if (!_initialized) {
    _initialized = true;
    mermaid.initialize({
      startOnLoad: false,
      theme: "dark",
      themeVariables: {
        background: "transparent",
        primaryColor: "#10b981",
        primaryTextColor: "#d1fae5",
        primaryBorderColor: "#059669",
        lineColor: "#34d399",
        secondaryColor: "#064e3b",
        tertiaryColor: "#022c22",
        edgeLabelBackground: "#022c22",
        fontSize: "13px",
      },
      flowchart: { curve: "basis", useMaxWidth: true, htmlLabels: true },
      sequence: { useMaxWidth: true },
    });
  }
  return mermaid;
}

export function MermaidPreview({ definition, className = "" }: MermaidPreviewProps) {
  // useId gives a stable, unique, React-safe ID — no side-effects on re-renders
  const reactId = useId();
  const id = `mermaid${reactId.replace(/:/g, "")}`;
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function render() {
      // Remove any stale mermaid temp element left by a previous render
      document.getElementById(id)?.remove();

      try {
        const mermaid = await getMermaid();
        const { svg } = await mermaid.render(id, definition);
        if (cancelled) return;
        if (containerRef.current) {
          containerRef.current.innerHTML = svg;
          const svgEl = containerRef.current.querySelector("svg");
          if (svgEl) {
            svgEl.removeAttribute("height");
            svgEl.style.width = "100%";
            svgEl.style.height = "auto";
            svgEl.style.maxHeight = "360px";
          }
        }
        setLoading(false);
      } catch {
        if (!cancelled) {
          setError(true);
          setLoading(false);
        }
      }
    }

    render();
    return () => {
      cancelled = true;
      // Clean up the temp element mermaid may have left in <body>
      document.getElementById(id)?.remove();
    };
  }, [definition, id]);

  if (error) {
    return (
      <div
        className={`flex min-h-48 items-center justify-center rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-8 text-sm text-emerald-400 ${className}`}
      >
        Could not render diagram preview
      </div>
    );
  }

  return (
    // min-h-48 ensures the spinner has height even before content loads
    <div className={`relative min-h-48 ${className}`}>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="size-6 animate-spin rounded-full border-2 border-emerald-500/40 border-t-emerald-400" />
        </div>
      )}
      <div
        ref={containerRef}
        className={`w-full transition-opacity duration-500 ${loading ? "opacity-0" : "opacity-100"}`}
      />
    </div>
  );
}
