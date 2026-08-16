import { jsPDF } from "jspdf";
import { AREAS, formatDate, statusLabel, type Inspection, type StatusId } from "./inspection";

const M = 15; // margem mm
const W = 210;
const H = 297;
const CONTENT = W - M * 2;

const STATUS_RGB: Record<StatusId, [number, number, number]> = {
  conforme: [22, 138, 90],
  parcial: [190, 138, 20],
  nao_conforme: [190, 46, 46],
};

function slug(value: string) {
  return (
    value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .toLowerCase() || "sem-nome"
  );
}

export function buildInspectionPdf(inspection: Inspection): jsPDF {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  let y = M;

  const ensure = (needed: number) => {
    if (y + needed > H - M) {
      doc.addPage();
      y = M;
    }
  };

  // Cabeçalho
  doc.setFillColor(17, 58, 66);
  doc.rect(0, 0, W, 32, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("Relatório de Inspeção de Loja", M, 15);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`Gerado em ${new Date().toLocaleString("pt-BR")}`, M, 23);
  y = 42;

  doc.setTextColor(20, 20, 20);
  const info: [string, string][] = [
    ["Rede", inspection.rede || "-"],
    ["Loja", inspection.loja || "-"],
    ["Data", formatDate(inspection.data) || "-"],
    ["Técnico", inspection.tecnico || "-"],
  ];
  doc.setFontSize(11);
  info.forEach(([label, value], i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = M + col * (CONTENT / 2);
    const ly = y + row * 12;
    doc.setFont("helvetica", "bold");
    doc.text(`${label}:`, x, ly);
    doc.setFont("helvetica", "normal");
    doc.text(doc.splitTextToSize(value, CONTENT / 2 - 25), x + 20, ly);
  });
  y += 12 * Math.ceil(info.length / 2) + 4;

  doc.setDrawColor(210, 210, 210);
  doc.line(M, y, W - M, y);
  y += 10;

  // Resumo
  const filled = AREAS.filter((a) => inspection.areas[a.id]);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("Resumo", M, y);
  y += 7;
  doc.setFontSize(10);
  filled.forEach((area) => {
    const entry = inspection.areas[area.id]!;
    ensure(8);
    const rgb = entry.status ? STATUS_RGB[entry.status] : ([120, 120, 120] as [number, number, number]);
    doc.setFillColor(...rgb);
    doc.circle(M + 1.6, y - 1.4, 1.6, "F");
    doc.setTextColor(20, 20, 20);
    doc.setFont("helvetica", "normal");
    doc.text(area.label, M + 6, y);
    doc.setTextColor(...rgb);
    doc.setFont("helvetica", "bold");
    doc.text(statusLabel(entry.status), W - M, y, { align: "right" });
    y += 7;
  });
  doc.setTextColor(20, 20, 20);
  y += 4;

  // Seções por área
  filled.forEach((area) => {
    const entry = inspection.areas[area.id]!;
    ensure(30);
    const rgb = entry.status ? STATUS_RGB[entry.status] : ([120, 120, 120] as [number, number, number]);

    doc.setFillColor(240, 244, 245);
    doc.rect(M, y - 5, CONTENT, 10, "F");
    doc.setFillColor(...rgb);
    doc.rect(M, y - 5, 2, 10, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(20, 20, 20);
    doc.text(area.label, M + 5, y + 1.5);
    doc.setTextColor(...rgb);
    doc.setFontSize(10);
    doc.text(statusLabel(entry.status), W - M - 2, y + 1.5, { align: "right" });
    doc.setTextColor(20, 20, 20);
    y += 12;

    const block = (title: string, text: string) => {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      ensure(10);
      doc.text(title, M, y);
      y += 5;
      doc.setFont("helvetica", "normal");
      const lines = doc.splitTextToSize(text.trim() || "—", CONTENT) as string[];
      lines.forEach((line) => {
        ensure(6);
        doc.text(line, M, y);
        y += 5;
      });
      y += 3;
    };

    block("Problemas encontrados", entry.problemas);
    block("Oportunidades", entry.oportunidades);

    if (entry.fotos.length) {
      doc.setFont("helvetica", "bold");
      ensure(8);
      doc.text("Fotos", M, y);
      y += 5;
      const gap = 5;
      const imgW = (CONTENT - gap) / 2;
      for (let i = 0; i < entry.fotos.length; i += 2) {
        const pair = entry.fotos.slice(i, i + 2);
        const heights = pair.map((src) => {
          const props = doc.getImageProperties(src);
          return (props.height / props.width) * imgW;
        });
        const rowH = Math.max(...heights);
        ensure(rowH + 4);
        pair.forEach((src, j) => {
          const imgH = heights[j] ?? rowH;
          doc.addImage(src, "JPEG", M + j * (imgW + gap), y, imgW, imgH);
        });
        y += rowH + 4;
      }
      y += 2;
    }
    y += 4;
  });

  // Rodapé com paginação
  const pages = doc.getNumberOfPages();
  for (let p = 1; p <= pages; p++) {
    doc.setPage(p);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(130, 130, 130);
    doc.text(`${inspection.loja || "Loja"} — ${formatDate(inspection.data)}`, M, H - 8);
    doc.text(`Página ${p} de ${pages}`, W - M, H - 8, { align: "right" });
  }

  return doc;
}

export function pdfFileName(inspection: Inspection) {
  return `inspecao-${slug(inspection.loja)}-${inspection.data}.pdf`;
}

export function downloadInspectionPdf(inspection: Inspection) {
  const doc = buildInspectionPdf(inspection);
  doc.save(pdfFileName(inspection));
}

export async function shareInspectionPdf(inspection: Inspection) {
  const doc = buildInspectionPdf(inspection);
  const blob = doc.output("blob");
  const file = new File([blob], pdfFileName(inspection), { type: "application/pdf" });
  const nav = navigator as Navigator & { canShare?: (data: { files: File[] }) => boolean };
  if (nav.share && nav.canShare?.({ files: [file] })) {
    await nav.share({ files: [file], title: pdfFileName(inspection) });
    return true;
  }
  doc.save(pdfFileName(inspection));
  return false;
}
