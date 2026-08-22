import type { ArtworkColor } from "@/types";

export type SamplePixel = {
  r: number;
  g: number;
  b: number;
  a: number;
};

/**
 * Client-side color-cluster analysis (prototype automation).
 * Sample pixels, bucket, merge nearby clusters, return hex + %.
 */
export function clusterArtworkColors(
  pixels: SamplePixel[],
  options?: { maxClusters?: number; minPct?: number; mergeDistance?: number }
): ArtworkColor[] {
  const maxClusters = options?.maxClusters ?? 20;
  const minPct = options?.minPct ?? 0.8;
  const mergeDistance = options?.mergeDistance ?? 50;
  const map = new Map<string, number>();

  for (const p of pixels) {
    if (p.a < 128) continue;
    const key = `${Math.round(p.r / 10) * 10},${Math.round(p.g / 10) * 10},${Math.round(p.b / 10) * 10}`;
    map.set(key, (map.get(key) ?? 0) + 1);
  }

  const sorted = [...map.entries()].sort((a, b) => b[1] - a[1]);
  const clusters: { rgb: [number, number, number]; count: number }[] = [];

  for (const [key, count] of sorted) {
    const rgb = key.split(",").map(Number) as [number, number, number];
    let merged = false;
    for (const cluster of clusters) {
      const dist = Math.sqrt(
        (rgb[0] - cluster.rgb[0]) ** 2 +
          (rgb[1] - cluster.rgb[1]) ** 2 +
          (rgb[2] - cluster.rgb[2]) ** 2
      );
      if (dist < mergeDistance) {
        cluster.count += count;
        merged = true;
        break;
      }
    }
    if (!merged && clusters.length < maxClusters) {
      clusters.push({ rgb, count });
    }
  }

  clusters.sort((a, b) => b.count - a.count);
  const tot = clusters.reduce((sum, c) => sum + c.count, 0);
  if (!tot) return [];

  return clusters
    .map((c) => ({
      hex: `#${c.rgb.map((x) => x.toString(16).padStart(2, "0")).join("")}`,
      pct: ((c.count / tot) * 100).toFixed(1),
    }))
    .filter((c) => Number(c.pct) >= minPct);
}

export function sampleImageData(
  data: Uint8ClampedArray,
  width: number,
  height: number
): SamplePixel[] {
  const step = Math.max(1, Math.floor((width * height) / 40000));
  const pixels: SamplePixel[] = [];
  for (let i = 0; i < data.length; i += 4 * step) {
    pixels.push({
      r: data[i],
      g: data[i + 1],
      b: data[i + 2],
      a: data[i + 3],
    });
  }
  return pixels;
}

export function analyzeCanvasColors(canvas: HTMLCanvasElement): ArtworkColor[] {
  const ctx = canvas.getContext("2d");
  if (!ctx) return [];
  const image = ctx.getImageData(0, 0, canvas.width, canvas.height);
  return clusterArtworkColors(
    sampleImageData(image.data, canvas.width, canvas.height)
  );
}
