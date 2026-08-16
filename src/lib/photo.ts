const MAX_SIZE = 1600;
const QUALITY = 0.72;

export async function compressToDataUrl(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_SIZE / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Não foi possível processar a imagem");
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close?.();
  return canvas.toDataURL("image/jpeg", QUALITY);
}

export async function filesToDataUrls(files: FileList | File[]): Promise<string[]> {
  const out: string[] = [];
  for (const file of Array.from(files)) {
    if (!file.type.startsWith("image/")) continue;
    out.push(await compressToDataUrl(file));
  }
  return out;
}
