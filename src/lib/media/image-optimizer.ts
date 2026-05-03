"use client";

export type OptimizeImageOptions = {
  maxWidth: number;
  maxHeight: number;
  targetMaxBytes: number;
  fallbackMaxBytes: number;
  outputType: "image/webp";
  qualityStart: number;
  qualityMin: number;
};

export type OptimizeImageResult = {
  file: File;
  blob: Blob;
  width: number;
  height: number;
  sizeBytes: number;
  originalSizeBytes: number;
  compressionRatio: number;
  previewUrl?: string;
};

async function toImageBitmap(file: File): Promise<ImageBitmap> {
  return createImageBitmap(file);
}

export async function optimizeImageFile(file: File, options: OptimizeImageOptions): Promise<OptimizeImageResult> {
  const bitmap = await toImageBitmap(file);
  const scale = Math.min(1, options.maxWidth / bitmap.width, options.maxHeight / bitmap.height);
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");

  if (!ctx) throw new Error("Image processing context unavailable.");

  ctx.drawImage(bitmap, 0, 0, width, height);

  const makeBlob = (quality: number) =>
    new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Could not encode image."));
      }, options.outputType, quality);
    });

  let quality = options.qualityStart;
  let blob = await makeBlob(quality);

  while (blob.size > options.targetMaxBytes && quality > options.qualityMin) {
    quality = Math.max(options.qualityMin, quality - 0.04);
    blob = await makeBlob(quality);
  }

  if (blob.size > options.fallbackMaxBytes) {
    throw new Error("Optimized image is still too large. Please choose another image.");
  }

  const optimizedFile = new File([blob], file.name.replace(/\.[^.]+$/, "") + ".webp", { type: "image/webp" });

  return {
    file: optimizedFile,
    blob,
    width,
    height,
    sizeBytes: blob.size,
    originalSizeBytes: file.size,
    compressionRatio: blob.size / file.size,
    previewUrl: URL.createObjectURL(blob),
  };
}
