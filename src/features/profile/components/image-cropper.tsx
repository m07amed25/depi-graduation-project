"use client";

import {
  useState,
  useRef,
  useCallback,
  useEffect,
  type PointerEvent as ReactPointerEvent,
  type WheelEvent as ReactWheelEvent,
} from "react";
import NextImage from "next/image";
import { cn } from "@/lib/utils";

// ─── Types ───────────────────────────────────────────────────────
export interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ImageCropperProps {
  /** Source image (object URL, data URL, or remote URL) */
  src: string;
  /** Forced aspect ratio (width / height). */
  aspectRatio?: number;
  /** Controlled zoom level */
  zoom?: number;
  /** Minimum zoom level (default: 1 = fit) */
  minZoom?: number;
  /** Maximum zoom level (default: 5) */
  maxZoom?: number;
  /** Called when the user changes zoom (wheel / pinch) */
  onZoomChange?: (zoom: number) => void;
  /** Called on every interaction with the normalised crop area (0-1 coords) */
  onCropChange?: (area: CropArea) => void;
  /** Container className */
  className?: string;
}

// ─── Helpers ─────────────────────────────────────────────────────
function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

// ─── Component ───────────────────────────────────────────────────
export function ImageCropper({
  src,
  aspectRatio = 1,
  zoom: controlledZoom,
  minZoom = 1,
  maxZoom = 5,
  onZoomChange,
  onCropChange,
  className,
}: ImageCropperProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  const [imgSize, setImgSize] = useState({ w: 0, h: 0 });
  const [containerSize, setContainerSize] = useState({ w: 0, h: 0 });

  // ── Controlled / uncontrolled zoom ──
  const [internalZoom, setInternalZoom] = useState(controlledZoom ?? 1);
  const zoom = controlledZoom ?? internalZoom;

  const updateZoom = useCallback(
    (next: number) => {
      const clamped = clamp(Math.round(next * 100) / 100, minZoom, maxZoom);
      if (onZoomChange) onZoomChange(clamped);
      else setInternalZoom(clamped);
    },
    [minZoom, maxZoom, onZoomChange],
  );

  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [showGrid, setShowGrid] = useState(false);
  const gridTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dragStart = useRef({ x: 0, y: 0, posX: 0, posY: 0 });

  // Show grid on interaction, auto-hide after idle
  const flashGrid = useCallback(() => {
    setShowGrid(true);
    if (gridTimeout.current) clearTimeout(gridTimeout.current);
    gridTimeout.current = setTimeout(() => setShowGrid(false), 800);
  }, []);

  // ── Derived: crop rectangle ────────────────────────────────────
  const cropRect = (() => {
    if (!containerSize.w || !containerSize.h) return { x: 0, y: 0, w: 0, h: 0 };
    const padding = 28;
    const maxW = containerSize.w - padding * 2;
    const maxH = containerSize.h - padding * 2;
    let w: number, h: number;
    if (aspectRatio >= 1) {
      w = Math.min(maxW, maxH * aspectRatio);
      h = w / aspectRatio;
    } else {
      h = Math.min(maxH, maxW / aspectRatio);
      w = h * aspectRatio;
    }
    return {
      x: (containerSize.w - w) / 2,
      y: (containerSize.h - h) / 2,
      w,
      h,
    };
  })();

  // ── Derived: scaled image size ─────────────────────────────────
  const scaledImg = (() => {
    if (!imgSize.w || !imgSize.h || !cropRect.w || !cropRect.h)
      return { w: 0, h: 0 };
    const fitScale = Math.max(cropRect.w / imgSize.w, cropRect.h / imgSize.h);
    const s = fitScale * zoom;
    return { w: imgSize.w * s, h: imgSize.h * s };
  })();

  // ── Constrain position ─────────────────────────────────────────
  const constrainPosition = useCallback(
    (pos: { x: number; y: number }) => {
      if (!scaledImg.w || !scaledImg.h) return pos;
      const xMin = cropRect.x + cropRect.w - scaledImg.w;
      const xMax = cropRect.x;
      const yMin = cropRect.y + cropRect.h - scaledImg.h;
      const yMax = cropRect.y;
      return {
        x: clamp(pos.x, Math.min(xMin, xMax), Math.max(xMin, xMax)),
        y: clamp(pos.y, Math.min(yMin, yMax), Math.max(yMin, yMax)),
      };
    },
    [scaledImg.w, scaledImg.h, cropRect.x, cropRect.y, cropRect.w, cropRect.h],
  );

  const [prevScaleSize, setPrevScaleSize] = useState({
    sw: scaledImg.w,
    sh: scaledImg.h,
    cw: containerSize.w,
    ch: containerSize.h,
  });

  if (
    scaledImg.w !== prevScaleSize.sw ||
    scaledImg.h !== prevScaleSize.sh ||
    containerSize.w !== prevScaleSize.cw ||
    containerSize.h !== prevScaleSize.ch
  ) {
    setPrevScaleSize({
      sw: scaledImg.w,
      sh: scaledImg.h,
      cw: containerSize.w,
      ch: containerSize.h,
    });
    if (scaledImg.w && scaledImg.h) {
      const centreX = (containerSize.w - scaledImg.w) / 2;
      const centreY = (containerSize.h - scaledImg.h) / 2;
      const nextPos =
        position.x === 0 && position.y === 0
          ? constrainPosition({ x: centreX, y: centreY })
          : constrainPosition(position);

      if (nextPos.x !== position.x || nextPos.y !== position.y) {
        setPosition(nextPos);
      }
    }
  }

  useEffect(() => {
    if (
      !onCropChange ||
      !scaledImg.w ||
      !scaledImg.h ||
      !imgSize.w ||
      !imgSize.h
    )
      return;
    const fitScale = Math.max(cropRect.w / imgSize.w, cropRect.h / imgSize.h);
    const s = fitScale * zoom;
    const ox = (cropRect.x - position.x) / s;
    const oy = (cropRect.y - position.y) / s;
    const cw = cropRect.w / s;
    const ch = cropRect.h / s;
    onCropChange({
      x: ox / imgSize.w,
      y: oy / imgSize.h,
      width: cw / imgSize.w,
      height: ch / imgSize.h,
    });
  }, [
    onCropChange,
    position.x,
    position.y,
    zoom,
    scaledImg.w,
    scaledImg.h,
    imgSize.w,
    imgSize.h,
    cropRect.x,
    cropRect.y,
    cropRect.w,
    cropRect.h,
  ]);

  // ── Observe container size ─────────────────────────────────────
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      if (!entry) return;
      setContainerSize({
        w: entry.contentRect.width,
        h: entry.contentRect.height,
      });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // ── Load image natural size ────────────────────────────────────
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      setImgSize({ w: img.naturalWidth, h: img.naturalHeight });
      imgRef.current = img;
      setPosition({ x: 0, y: 0 });
    };
    img.src = src;
  }, [src]);

  // ── Pointer drag ───────────────────────────────────────────────
  const handlePointerDown = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      e.preventDefault();
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      setIsDragging(true);
      flashGrid();
      dragStart.current = {
        x: e.clientX,
        y: e.clientY,
        posX: position.x,
        posY: position.y,
      };
    },
    [position.x, position.y, flashGrid],
  );

  const handlePointerMove = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      if (!isDragging) return;
      setPosition(
        constrainPosition({
          x: dragStart.current.posX + e.clientX - dragStart.current.x,
          y: dragStart.current.posY + e.clientY - dragStart.current.y,
        }),
      );
    },
    [isDragging, constrainPosition],
  );

  const handlePointerUp = useCallback(() => setIsDragging(false), []);

  // ── Wheel zoom ─────────────────────────────────────────────────
  const handleWheel = useCallback(
    (e: ReactWheelEvent<HTMLDivElement>) => {
      e.preventDefault();
      updateZoom(zoom + -e.deltaY * 0.002);
      flashGrid();
    },
    [zoom, updateZoom, flashGrid],
  );

  const lastPinchDist = useRef<number | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const dist = Math.hypot(dx, dy);
        if (lastPinchDist.current !== null) {
          updateZoom(zoom + (dist - lastPinchDist.current) * 0.005);
          flashGrid();
        }
        lastPinchDist.current = dist;
      }
    };
    const onTouchEnd = () => {
      lastPinchDist.current = null;
    };
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", onTouchEnd);
    return () => {
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
    };
  }, [zoom, updateZoom, flashGrid]);

  const corners = [
    {
      pos: "top-0 left-0",
      border: "border-t-[3px] border-l-[3px]",
      round: "rounded-tl",
    },
    {
      pos: "top-0 right-0",
      border: "border-t-[3px] border-r-[3px]",
      round: "rounded-tr",
    },
    {
      pos: "bottom-0 left-0",
      border: "border-b-[3px] border-l-[3px]",
      round: "rounded-bl",
    },
    {
      pos: "bottom-0 right-0",
      border: "border-b-[3px] border-r-[3px]",
      round: "rounded-br",
    },
  ];

  const edges = [
    {
      style: {
        top: -1,
        left: "50%",
        transform: "translateX(-50%)",
        width: 28,
        height: 3,
      } as React.CSSProperties,
    },
    {
      style: {
        bottom: -1,
        left: "50%",
        transform: "translateX(-50%)",
        width: 28,
        height: 3,
      } as React.CSSProperties,
    },
    {
      style: {
        left: -1,
        top: "50%",
        transform: "translateY(-50%)",
        width: 3,
        height: 28,
      } as React.CSSProperties,
    },
    {
      style: {
        right: -1,
        top: "50%",
        transform: "translateY(-50%)",
        width: 3,
        height: 28,
      } as React.CSSProperties,
    },
  ];

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative overflow-hidden select-none bg-neutral-950 touch-none",
        isDragging ? "cursor-grabbing" : "cursor-grab",
        className,
      )}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onWheel={handleWheel}
    >
      {/* Subtle checkerboard for empty areas */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(45deg,#fff 25%,transparent 25%),linear-gradient(-45deg,#fff 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#fff 75%),linear-gradient(-45deg,transparent 75%,#fff 75%)",
          backgroundSize: "20px 20px",
          backgroundPosition: "0 0,0 10px,10px -10px,-10px 0",
        }}
      />

      {/* Cropped source image */}
      {imgSize.w > 0 && src && (
        <NextImage
          src={src}
          alt=""
          width={Math.round(scaledImg.w)}
          height={Math.round(scaledImg.h)}
          draggable={false}
          unoptimized
          className="absolute pointer-events-none"
          style={{
            left: position.x,
            top: position.y,
            width: scaledImg.w,
            height: scaledImg.h,
            willChange: "left, top, width, height",
            transition: isDragging
              ? "none"
              : "left .15s cubic-bezier(.4,0,.2,1),top .15s cubic-bezier(.4,0,.2,1),width .2s cubic-bezier(.4,0,.2,1),height .2s cubic-bezier(.4,0,.2,1)",
          }}
        />
      )}

      {/* Dark overlay with transparent crop hole */}
      <div
        className="absolute inset-0 pointer-events-none transition-opacity duration-200"
        style={{
          background: "rgba(0,0,0,0.6)",
          backdropFilter: isDragging ? "none" : "blur(1px)",
          maskImage: "linear-gradient(#000 0 0),linear-gradient(#000 0 0)",
          maskComposite: "exclude",
          WebkitMaskImage:
            "linear-gradient(#000 0 0),linear-gradient(#000 0 0)",
          WebkitMaskComposite: "xor",
          maskSize: `100% 100%, ${cropRect.w}px ${cropRect.h}px`,
          maskPosition: `0 0, ${cropRect.x}px ${cropRect.y}px`,
          maskRepeat: "no-repeat",
          WebkitMaskSize: `100% 100%, ${cropRect.w}px ${cropRect.h}px`,
          WebkitMaskPosition: `0 0, ${cropRect.x}px ${cropRect.y}px`,
          WebkitMaskRepeat: "no-repeat",
        }}
      />

      <div
        className="absolute pointer-events-none"
        style={{
          left: cropRect.x,
          top: cropRect.y,
          width: cropRect.w,
          height: cropRect.h,
        }}
      >
        {/* Border + subtle inner shadow */}
        <div className="absolute inset-0 rounded-[3px] border border-white/70 shadow-[0_0_0_1px_rgba(0,0,0,0.25),inset_0_0_0_1px_rgba(0,0,0,0.1)]" />

        {/* Rule-of-thirds grid — fades in on interaction */}
        <div
          className="absolute inset-0 transition-opacity duration-300 ease-out"
          style={{ opacity: showGrid || isDragging ? 1 : 0 }}
        >
          {[1, 2].map((i) => (
            <div
              key={`v${i}`}
              className="absolute top-0 bottom-0 w-px"
              style={{
                left: `${(i / 3) * 100}%`,
                background:
                  "linear-gradient(to bottom,transparent,rgba(255,255,255,0.35) 20%,rgba(255,255,255,0.35) 80%,transparent)",
              }}
            />
          ))}
          {[1, 2].map((i) => (
            <div
              key={`h${i}`}
              className="absolute left-0 right-0 h-px"
              style={{
                top: `${(i / 3) * 100}%`,
                background:
                  "linear-gradient(to right,transparent,rgba(255,255,255,0.35) 20%,rgba(255,255,255,0.35) 80%,transparent)",
              }}
            />
          ))}
          {/* Centre dot */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 size-1.5 rounded-full bg-white/70 shadow-[0_0_4px_rgba(0,0,0,0.5)]" />
        </div>

        {/* Corner L-handles */}
        {corners.map(({ pos, border, round }) => (
          <div
            key={pos}
            className={cn(
              "absolute size-5 border-white transition-all duration-200",
              pos,
              border,
              round,
              isDragging ? "scale-90 opacity-70" : "scale-100 opacity-100",
            )}
            style={{ filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.5))" }}
          />
        ))}

        {/* Edge mid-point bars */}
        {edges.map(({ style }, i) => (
          <div
            key={i}
            className={cn(
              "absolute rounded-full bg-white/80 transition-opacity duration-200",
              isDragging ? "opacity-50" : "opacity-90",
            )}
            style={{
              ...style,
              filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.4))",
            }}
          />
        ))}
      </div>

      {/* Zoom % badge — shown briefly on zoom */}
      {showGrid && !isDragging && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 px-2.5 py-1 rounded-full bg-black/70 text-white text-[11px] font-medium tabular-nums backdrop-blur-sm animate-in fade-in-0 zoom-in-95 duration-150 pointer-events-none">
          {Math.round(zoom * 100)}%
        </div>
      )}

      {/* Instruction hint */}
      {imgSize.w > 0 && !isDragging && zoom <= 1.01 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-full bg-black/50 backdrop-blur-sm text-white/70 text-[11px] pointer-events-none flex items-center gap-1.5 animate-in fade-in-0 slide-in-from-bottom-2 duration-500">
          <svg
            viewBox="0 0 16 16"
            fill="currentColor"
            className="size-3 opacity-60"
          >
            <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1ZM7.25 5a.75.75 0 1 1 1.5 0 .75.75 0 0 1-1.5 0ZM7 7.25a.75.75 0 0 1 1.5 0v3.5a.75.75 0 0 1-1.5 0v-3.5Z" />
          </svg>
          Drag to move · Scroll to zoom
        </div>
      )}
    </div>
  );
}

// ─── Utility: crop to Blob ───────────────────────────────────────
export function cropImageToBlob(
  imgSrc: string,
  crop: CropArea,
  outputSize = 512,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = outputSize;
      canvas.height = outputSize;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("Canvas not supported"));
      const sx = crop.x * img.naturalWidth;
      const sy = crop.y * img.naturalHeight;
      const sw = crop.width * img.naturalWidth;
      const sh = crop.height * img.naturalHeight;
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, outputSize, outputSize);
      canvas.toBlob(
        (blob) =>
          blob ? resolve(blob) : reject(new Error("Failed to create blob")),
        "image/jpeg",
        0.92,
      );
    };
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = imgSrc;
  });
}

export default ImageCropper;
