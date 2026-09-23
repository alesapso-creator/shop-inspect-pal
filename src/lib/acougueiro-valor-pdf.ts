import { jsPDF } from "jspdf";
import timbre from "@/assets/timbre-friboi.jpg.asset.json";
import { nivelLabel } from "./inspection";
import { formatValorDate, type AcougueiroValor } from "./acougueiro-valor";

const M = 15;
const W = 210;
const H = 297;
const CONTENT = W - M * 2;
let timbreCache: string | null = null;

async function loadTimbre(): Promise<string | null> {
  if (timbreCache) return timbreCache;
  try {
    const response = await fetch(timbre.url);
    const blob = await response.blob();
    timbreCache = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(blob);
    });
    return timbreCache;
  } catch {
    return null;
  }
}

function slug(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-|-$/g, "").toLowerCase() || "colaborador";
}

function fitImage(doc: jsPDF, src: string, maxW: number, maxH: number) {
  const props = doc.getImageProperties(src);
  const scale = Math.min(maxW / props.width, maxH / props.height);
  return { width: props.width * scale, height: props.height * scale };
}

export async function buildAcougueiroValorPdf(item: AcougueiroValor): Promise<jsPDF> {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  let y = M;
  const ensure = (needed: number) => {
    if (y + needed > H - M) {
      doc.addPage();
      y = M;
    }
  };

  const bg = await loadTimbre();
  if (bg) {
    const props = doc.getImageProperties(bg);
    const imgW = W * 0.28;
    doc.addImage(bg, "JPEG", 0, 0, imgW, (props.height / props.width) * imgW);
  }
  doc.setTextColor(20, 20, 20);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("Açougueiro de Valor", bg ? 66 : M, bg ? 12 : 17);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(105, 105, 105);
  doc.text("Reconhecimento profissional Friboi+", bg ? 66 : M, bg ? 18 : 24);
  y = bg ? 31 : 36;

  if (item.fotoPerfil) {
    const boxW = 52;
    const boxH = 66;
    const size = fitImage(doc, item.fotoPerfil, boxW, boxH);
    doc.setFillColor(244, 246, 247);
    doc.roundedRect(M, y, boxW, boxH, 2, 2, "F");
    doc.addImage(item.fotoPerfil, "JPEG", M + (boxW - size.width) / 2, y + (boxH - size.height) / 2, size.width, size.height);

    const infoX = M + boxW + 9;
    let infoY = y + 5;
    const info: [string, string][] = [
      ["Colaborador", item.colaborador],
      ["Nível", item.nivel ? nivelLabel(item.nivel) : "-"],
      ["Rede", item.rede],
      ["Loja", item.loja],
      ["Data", formatValorDate(item.data)],
      ["Técnico", item.tecnico],
    ];
    info.forEach(([label, value]) => {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(90, 90, 90);
      doc.text(label.toUpperCase(), infoX, infoY);
      infoY += 4.5;
      doc.setFontSize(11);
      doc.setTextColor(20, 20, 20);
      doc.text(doc.splitTextToSize(value || "-", W - M - infoX) as string[], infoX, infoY);
      infoY += 7;
    });
    y += boxH + 9;
  }

  const renderHighlights = (title: string, values: string[]) => {
    if (!values.length) return;
    ensure(15 + values.length * 7);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(20, 20, 20);
    doc.text(title, M, y);
    y += 7;
    values.forEach((value) => {
      doc.setFillColor(22, 138, 90);
      doc.circle(M + 2, y - 1.5, 1.6, "F");
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text(value, M + 7, y);
      y += 7;
    });
    y += 3;
  };

  renderHighlights("Destaques — Balcão de Atendimento", item.destaquesAtendimento);
  renderHighlights("Destaques — Balcão de Autosserviço", item.destaquesAutosservico);

  ensure(30);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("Reconhecimento", M, y);
  y += 7;
  doc.setFillColor(243, 246, 248);
  const commentLines = doc.splitTextToSize(item.comentario || "—", CONTENT - 12) as string[];
  const commentH = Math.max(20, commentLines.length * 5 + 10);
  ensure(commentH);
  doc.roundedRect(M, y, CONTENT, commentH, 2, 2, "F");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(35, 35, 35);
  doc.text(commentLines, M + 6, y + 7);
  y += commentH + 9;

  if (item.fotosTrabalho.length) {
    ensure(15);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text("Trabalho em destaque", M, y);
    y += 7;
    const cols = 3;
    const gap = 3;
    const cellW = (CONTENT - gap * (cols - 1)) / cols;
    const maxH = 42;
    for (let i = 0; i < item.fotosTrabalho.length; i += cols) {
      const group = item.fotosTrabalho.slice(i, i + cols);
      const sizes = group.map((src) => fitImage(doc, src, cellW, maxH));
      const rowH = Math.max(...sizes.map((size) => size.height));
      ensure(rowH + 5);
      group.forEach((src, index) => {
        const size = sizes[index];
        if (!size) return;
        const cellX = M + index * (cellW + gap);
        doc.addImage(src, "JPEG", cellX + (cellW - size.width) / 2, y, size.width, size.height);
      });
      y += rowH + 5;
    }
  }

  const pages = doc.getNumberOfPages();
  for (let page = 1; page <= pages; page++) {
    doc.setPage(page);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(130, 130, 130);
    doc.text(`${item.colaborador || "Colaborador"} — ${formatValorDate(item.data)}`, M, H - 8);
    doc.text(`Página ${page} de ${pages}`, W - M, H - 8, { align: "right" });
  }
  return doc;
}

export function acougueiroValorFileName(item: AcougueiroValor) {
  return `acougueiro-de-valor-${slug(item.colaborador)}-${item.data}.pdf`;
}

export async function downloadAcougueiroValorPdf(item: AcougueiroValor) {
  const doc = await buildAcougueiroValorPdf(item);
  doc.save(acougueiroValorFileName(item));
}

export async function shareAcougueiroValorPdf(item: AcougueiroValor) {
  const doc = await buildAcougueiroValorPdf(item);
  const file = new File([doc.output("blob")], acougueiroValorFileName(item), { type: "application/pdf" });
  const nav = navigator as Navigator & { canShare?: (data: { files: File[] }) => boolean };
  if (nav.share && nav.canShare?.({ files: [file] })) {
    await nav.share({ files: [file], title: "Açougueiro de Valor" });
    return true;
  }
  doc.save(acougueiroValorFileName(item));
  return false;
}