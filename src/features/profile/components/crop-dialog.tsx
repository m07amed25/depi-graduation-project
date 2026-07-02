"use client";

import { useState, useCallback, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import Image from "next/image";
import {
  ImageCropper,
  cropImageToBlob,
  type CropArea,
} from "@/features/profile/components/image-cropper";

// ─── Types ───────────────────────────────────────────────────────
export interface CropDialogProps {
  /** Image source to crop */
  src: string;
  /** Whether the dialog is open */
  open: boolean;
  /** Called when the dialog is closed */
  onOpenChange: (open: boolean) => void;
  /** Called with the cropped blob when the user confirms */
  onCrop: (blob: Blob) => void | Promise<void>;
  /** Output pixel size (default 512) */
  outputSize?: number;
  /** Dialog title */
  title?: string;
}

// ─── Aspect-ratio presets ────────────────────────────────────────
const ASPECTS = [
  { label: "1:1", value: 1 },
  { label: "4:3", value: 4 / 3 },
  { label: "16:9", value: 16 / 9 },
  { label: "3:4", value: 3 / 4 },
] as const;

// ─── Component ───────────────────────────────────────────────────
export function CropDialog({
  src,
  open,
  onOpenChange,
  onCrop,
  outputSize = 512,
  title = "Crop Image",
}: CropDialogProps) {
  const [zoom, setZoom] = useState(1);
  const [aspect, setAspect] = useState(1);
  const [busy, setBusy] = useState(false);
  const cropRef = useRef<CropArea>({ x: 0, y: 0, width: 1, height: 1 });

  const handleCropChange = useCallback((area: CropArea) => {
    cropRef.current = area;
  }, []);

  const handleReset = useCallback(() => {
    setZoom(1);
    setAspect(1);
  }, []);

  const handleConfirm = useCallback(async () => {
    setBusy(true);
    try {
      const blob = await cropImageToBlob(src, cropRef.current, outputSize);
      await onCrop(blob);
    } catch (err) {
      console.error("Crop failed:", err);
    } finally {
      setBusy(false);
    }
  }, [src, outputSize, onCrop]);

  // Live preview via tiny canvas (64px) — intentionally kept simple
  const [preview, setPreview] = useState<string | null>(null);
  const previewTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleCropChangeWithPreview = useCallback(
    (area: CropArea) => {
      handleCropChange(area);
      // Throttle preview updates
      if (previewTimer.current) clearTimeout(previewTimer.current);
      previewTimer.current = setTimeout(() => {
        cropImageToBlob(src, area, 64)
          .then((b) => setPreview(URL.createObjectURL(b)))
          .catch(() => {});
      }, 150);
    },
    [handleCropChange, src],
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl p-0 gap-0 overflow-hidden">
        <DialogHeader className="p-4 pb-2">
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription className="sr-only">
            Drag to reposition, scroll to zoom, then confirm your crop.
          </DialogDescription>
        </DialogHeader>

        {/* Cropper viewport */}
        <div className="relative w-full" style={{ height: 380 }}>
          <ImageCropper
            src={src}
            aspectRatio={aspect}
            zoom={zoom}
            onZoomChange={setZoom}
            minZoom={1}
            maxZoom={5}
            onCropChange={handleCropChangeWithPreview}
            className="size-full"
          />

          {/* Live preview circle */}
          {preview && (
            <div className="absolute top-3 right-3 size-14 rounded-full overflow-hidden border-2 border-white/80 shadow-lg pointer-events-none animate-in fade-in-0 zoom-in-90 duration-200">
              <Image src={preview} alt="" width={56} height={56} unoptimized className="size-full object-cover" />
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="border-t p-4 space-y-3">
          {/* Zoom slider */}
          <div className="flex items-center gap-3">
            <svg
              viewBox="0 0 16 16"
              fill="currentColor"
              className="size-4 text-muted-foreground shrink-0"
            >
              <path d="M6.5 1a5.5 5.5 0 0 1 4.383 8.823l3.896 3.9a.75.75 0 0 1-1.06 1.06l-3.9-3.896A5.5 5.5 0 1 1 6.5 1ZM3 6.5a3.5 3.5 0 1 0 7 0 3.5 3.5 0 0 0-7 0Z" />
            </svg>
            <Slider
              min={1}
              max={5}
              step={0.01}
              value={[zoom]}
              onValueChange={([v]) => setZoom(v)}
              className="flex-1"
            />
            <span className="text-xs text-muted-foreground tabular-nums w-10 text-right">
              {Math.round(zoom * 100)}%
            </span>
          </div>

          {/* Aspect ratio presets */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground mr-1">Ratio</span>
            {ASPECTS.map(({ label, value }) => (
              <button
                key={label}
                type="button"
                onClick={() => setAspect(value)}
                className={cn(
                  "px-2.5 py-1 rounded-md text-xs font-medium transition-colors duration-150",
                  Math.abs(aspect - value) < 0.01
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80",
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <DialogFooter className="border-t p-4 flex-row justify-between sm:justify-between">
          <Button variant="ghost" size="sm" onClick={handleReset} disabled={busy}>
            Reset
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} disabled={busy}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleConfirm} disabled={busy}>
              {busy ? "Cropping…" : "Apply"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default CropDialog;
