"use client";

import { useRef } from "react";
import { COLOR_METHODS, STEP_SUBTITLES, STEP_TITLES } from "@/components/estimator/wizard-constants";
import { Pill } from "@/components/estimator/pill";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { analyzeCanvasColors } from "@/lib/pricing/artwork-colors";
import { stationCount } from "@/lib/pricing/engine";
import { cn } from "@/lib/utils";
import type { ArtworkColor, ColorMethod, QuoteSpec } from "@/types";

export function ColorsStep({
  spec,
  artworkUrl,
  onChange,
  onArtwork,
}: {
  spec: QuoteSpec;
  artworkUrl: string | null;
  onChange: (patch: Partial<QuoteSpec>) => void;
  onArtwork: (url: string | null) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stations = stationCount(spec);

  function handleFile(file?: File) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => onArtwork(String(e.target?.result ?? ""));
    reader.readAsDataURL(file);
  }

  function onImageLoad(img: HTMLImageElement) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const scale = Math.min(500 / img.naturalWidth, 500 / img.naturalHeight, 1);
    canvas.width = Math.round(img.naturalWidth * scale);
    canvas.height = Math.round(img.naturalHeight * scale);
    canvas.getContext("2d")?.drawImage(img, 0, 0, canvas.width, canvas.height);
    try {
      const colors = analyzeCanvasColors(canvas);
      applyDetected(colors);
    } catch {
      // keep manual stations
    }
  }

  function applyDetected(colors: ArtworkColor[]) {
    const method: ColorMethod =
      colors.length >= 8 ? "process" : colors.length <= 3 ? "spot" : "mixed";
    onChange({
      artworkColors: colors,
      colorMethod: method,
      frontColors: colors.length >= 8 ? 4 : Math.min(colors.length, 6),
    });
  }

  return (
    <div>
      <h2 className="heading-font text-3xl md:text-4xl font-semibold tracking-tight">
        {STEP_TITLES[3]}
      </h2>
      <p className="mt-2 font-mono text-xs text-slate-500 max-w-xl">
        {STEP_SUBTITLES[3]}
      </p>
      <div className="mt-8 grid lg:grid-cols-[1fr_300px] gap-6">
        <div>
          {!artworkUrl ? (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                handleFile(e.dataTransfer.files[0]);
              }}
              className="w-full rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50 px-8 py-16 text-center hover:border-teal"
            >
              <div className="text-3xl mb-2">🎨</div>
              <div className="font-semibold">Drop artwork here</div>
              <div className="mt-1 font-mono text-[11px] text-slate-400">
                PNG or JPG — optional. Colors are extracted locally.
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFile(e.target.files?.[0])}
              />
            </button>
          ) : (
            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white">
              <div className="flex items-center justify-between border-b bg-slate-50 px-4 py-2">
                <span className="font-mono text-[10px] uppercase tracking-wider text-slate-400">
                  Artwork preview
                </span>
                <button
                  type="button"
                  className="font-mono text-[10px] text-slate-500"
                  onClick={() => {
                    onArtwork(null);
                    onChange({ artworkColors: [] });
                  }}
                >
                  Replace
                </button>
              </div>
              <div className="flex min-h-40 items-center justify-center bg-slate-50 p-4">
                {/* extracted color analysis, not next/image LCP */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={artworkUrl}
                  alt="Artwork"
                  className="max-h-56 max-w-full object-contain"
                />
              </div>
            </div>
          )}
          {artworkUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={artworkUrl}
              alt=""
              className="absolute -left-[9999px] max-w-[500px]"
              onLoad={(e) => onImageLoad(e.currentTarget)}
            />
          )}
        </div>
        <div className="space-y-3">
          {(spec.artworkColors?.length ?? 0) > 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="mb-2 font-mono text-[10px] uppercase tracking-wider text-slate-400">
                Detected colors ({spec.artworkColors?.length})
              </div>
              <div className="flex flex-wrap gap-1.5">
                {spec.artworkColors?.map((c) => (
                  <div
                    key={c.hex}
                    title={`${c.hex} — ${c.pct}%`}
                    className="h-7 w-7 rounded-md border border-black/10"
                    style={{ background: c.hex }}
                  />
                ))}
              </div>
            </div>
          )}
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="mb-2 font-mono text-[10px] uppercase tracking-wider text-slate-400">
              Color method
            </div>
            <div className="flex flex-col gap-1.5">
              {COLOR_METHODS.map((m) => (
                <Pill
                  key={m.id}
                  on={spec.colorMethod === m.id}
                  onClick={() => onChange({ colorMethod: m.id })}
                  className="w-full py-2"
                >
                  <div className={cn("text-sm font-semibold", spec.colorMethod === m.id && "text-teal")}>
                    {m.label}
                  </div>
                  <div className="font-mono text-[10px] text-slate-400">{m.desc}</div>
                </Pill>
              ))}
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="mb-2 font-mono text-[10px] uppercase tracking-wider text-slate-400">
              Ink stations
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Front colors</Label>
                <Input
                  type="number"
                  min={0}
                  max={10}
                  className="mt-1 text-center font-mono font-bold"
                  value={spec.frontColors ?? 0}
                  onChange={(e) =>
                    onChange({ frontColors: Number(e.target.value) || 0 })
                  }
                />
              </div>
              <div>
                <Label>Back colors</Label>
                <Input
                  type="number"
                  min={0}
                  max={10}
                  className="mt-1 text-center font-mono font-bold"
                  value={spec.backColors ?? 0}
                  onChange={(e) =>
                    onChange({ backColors: Number(e.target.value) || 0 })
                  }
                />
              </div>
            </div>
            <div className="mt-3 flex gap-2">
              <Pill
                on={Boolean(spec.whitePlate)}
                onClick={() => onChange({ whitePlate: !spec.whitePlate })}
                className="flex-1 py-2 text-center font-mono text-xs"
              >
                {spec.whitePlate ? "✓" : "+"} White plate
              </Pill>
              <Pill
                on={Boolean(spec.varnish)}
                onClick={() => onChange({ varnish: !spec.varnish })}
                className="flex-1 py-2 text-center font-mono text-xs"
              >
                {spec.varnish ? "✓" : "+"} Varnish
              </Pill>
            </div>
            <div className="mt-3 flex items-center justify-between rounded-2xl bg-navy px-4 py-3 text-white">
              <span className="font-mono text-xs text-slate-300">Total stations</span>
              <span className="heading-font text-2xl">{stations}</span>
            </div>
          </div>
        </div>
      </div>
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
