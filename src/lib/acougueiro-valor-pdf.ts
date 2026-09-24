import { jsPDF } from "jspdf";
import timbre from "@/assets/timbre-friboi.jpg.asset.json";
import { nivelLabel } from "./inspection";
import { formatValorDate, type AcougueiroValor } from "./acougueiro-valor";

const M = 15;
const W = 210;
const H = 297;
const CONTENT = W - M * 2;
const AGRADECIMENTO = "Nós, do Friboi+, temos orgulho de reconhecer este momento de profissionalismo e dedicação. Cada conquista reflete o compromisso com o aprendizado, a excelência e a valorização de quem faz a diferença todos os dias.";
const FRASE_FINAL = "Que este reconhecimento inspire novas conquistas e fortaleça uma cultura que valoriza pessoas, dedicação e excelência.";
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
  y = bg ? 27 : 31;

  doc.setFillColor(237, 246, 241);
  const thankYouInset = 9;
  const thankYouLines = doc.splitTextToSize(AGRADECIMENTO, CONTENT - thankYouInset * 2) as string[];
  const thankYouH = thankYouLines.length * 5 + 17;
  ensure(thankYouH);
  doc.roundedRect(M, y, CONTENT, thankYouH, 2, 2, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(22, 112, 75);
  doc.text("UM RECONHECIMENTO FRIBOI+", M + thankYouInset, y + 7);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(35, 35, 35);
  doc.text(thankYouLines, M + thankYouInset, y + 14);
  y += thankYouH + 5;

  const infoColumns: [string, string][][] = [
    [["Rede", item.rede], ["Loja", item.loja], ["Técnico", item.tecnico]],
    [["Colaborador", item.colaborador], ["Data", formatValorDate(item.data)], ["Nível", item.nivel ? nivelLabel(item.nivel) : "-"]],
  ];
  const columnGap = 8;
  const columnW = (CONTENT - columnGap) / 2;
  const infoStartY = y;
  infoColumns.forEach((column, columnIndex) => {
    const infoX = M + columnIndex * (columnW + columnGap);
    let infoY = infoStartY;
    column.forEach(([label, value]) => {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      doc.setTextColor(90, 90, 90);
      doc.text(label.toUpperCase(), infoX, infoY);
      infoY += 3.5;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(20, 20, 20);
      const valueLines = doc.splitTextToSize(value || "-", columnW) as string[];
      doc.text(valueLines, infoX, infoY);
      infoY += Math.max(7, valueLines.length * 4 + 3);
    });
  });
  y += 33;

  const renderHighlights = (title: string, values: string[], description: string, x: number, width: number, startY: number) => {
    if (!values.length) return;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(20, 20, 20);
    doc.text(title, x, startY);
    let highlightY = startY + 5;
    values.forEach((value) => {
      const lines = doc.splitTextToSize(value, width - 7) as string[];
      doc.setFillColor(22, 138, 90);
      doc.circle(x + 1.3, highlightY - 1.2, 1.1, "F");
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(35, 35, 35);
      doc.text(lines, x + 5, highlightY);
      highlightY += Math.max(5, lines.length * 3.8 + 1);
    });
    if (description.trim()) {
      const descriptionLines = doc.splitTextToSize(description.trim(), width - 5) as string[];
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      doc.setTextColor(90, 90, 90);
      doc.text("DESTAQUE", x, highlightY);
      highlightY += 3.5;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(35, 35, 35);
      doc.text(descriptionLines, x, highlightY);
      highlightY += descriptionLines.length * 3.8 + 2;
    }
    return highlightY;
  };

  const selectedValues = (values: string[], other?: string) => [
    ...values.filter((value) => value !== "Outros"),
    ...(values.includes("Outros") && other?.trim() ? [other.trim()] : []),
  ];
  const photoW = 52;
  const photoH = 66;
  const highlightsX = M + photoW + 9;
  const highlightsW = W - M - highlightsX;
  const allGroups = [
    { title: "Balcão de Atendimento", values: selectedValues(item.destaquesAtendimento, item.outrosAtendimento), description: item.habilidadeAtendimento ?? "" },
    { title: "Balcão de Autosserviço", values: selectedValues(item.destaquesAutosservico, item.outrosAutosservico), description: item.habilidadeAutosservico ?? "" },
    { title: "Câmara fria", values: selectedValues(item.destaquesCamaraFria ?? [], item.outrosCamaraFria), description: item.habilidadeCamaraFria ?? "" },
  ].filter((group) => group.values.length || group.description.trim());
  const estimatedHighlightsH = allGroups.reduce((height, group) => height + 8 + group.values.length * 5 + Math.ceil(group.description.length / 55) * 4, 0);
  ensure(Math.max(photoH, estimatedHighlightsH) + 6);
  const profileStartY = y;
  if (item.fotoPerfil) {
    const size = fitImage(doc, item.fotoPerfil, photoW, photoH);
    doc.setFillColor(244, 246, 247);
    doc.roundedRect(M, profileStartY, photoW, photoH, 2, 2, "F");
    doc.addImage(item.fotoPerfil, "JPEG", M + (photoW - size.width) / 2, profileStartY + (photoH - size.height) / 2, size.width, size.height);
  }
  let highlightsY = profileStartY;
  allGroups.forEach((group) => {
    const nextY = renderHighlights(group.title, group.values, group.description, highlightsX, highlightsW, highlightsY);
    if (nextY) highlightsY = nextY + 2;
  });
  y = Math.max(profileStartY + photoH, highlightsY) + 8;

  ensure(30);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("Impacto gerado", M, y);
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

  let finalPhraseRendered = false;
  const renderFinalPhrase = (x: number, width: number, startY: number) => {
    const lines = doc.splitTextToSize(FRASE_FINAL, width - 12) as string[];
    const lineY = startY + 2;
    doc.setDrawColor(22, 138, 90);
    doc.setLineWidth(0.8);
    doc.line(x + 6, lineY, x + width - 6, lineY);
    doc.setFont("helvetica", "oblique");
    doc.setFontSize(9);
    doc.setTextColor(35, 85, 63);
    doc.text(lines, x + width / 2, lineY + 7, { align: "center" });
    finalPhraseRendered = true;
    return lines.length * 4.2 + 12;
  };

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
      const isLastRow = i + cols >= item.fotosTrabalho.length;
      if (isLastRow && group.length < cols) {
        const phraseX = M + group.length * (cellW + gap);
        const phraseW = CONTENT - group.length * (cellW + gap);
        renderFinalPhrase(phraseX, phraseW, y);
      }
      y += rowH + 5;
    }
  }

  if (!finalPhraseRendered) {
    const finalLines = doc.splitTextToSize(FRASE_FINAL, CONTENT - 28) as string[];
    const finalH = Math.max(20, finalLines.length * 5 + 10);
    ensure(finalH + 9);
    y += 5;
    renderFinalPhrase(M + 8, CONTENT - 16, y);
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