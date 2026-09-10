import { jsPDF } from "jspdf";
import { calcular, formatDate, kg, pct, num, type Medicao, type Rendimento } from "./rendimento";

import timbre from "@/assets/timbre-friboi.jpg.asset.json";

let timbreCache: string | null = null;

async function loadTimbre(): Promise<string | null> {
  if (timbreCache) return timbreCache;
  try {
    const res = await fetch(timbre.url);
    const blob = await res.blob();
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

const M = 15;
const W = 210;
const H = 297;
const CONTENT = W - M * 2;

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

export async function buildRendimentoPdf(r: Rendimento): Promise<jsPDF> {
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
    const imgW = W * 0.22;
    doc.addImage(bg, "JPEG", 0, 0, imgW, (props.height / props.width) * imgW);
  }

  doc.setTextColor(20, 20, 20);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.text("Relatório de Rendimento Bovino", bg ? 55 : M, bg ? 11 : 15);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(110, 110, 110);
  doc.text(`Gerado em ${new Date().toLocaleString("pt-BR")}`, bg ? 55 : M, bg ? 16 : 23);
  y = bg ? 24 : 42;

  doc.setTextColor(20, 20, 20);
  const info: [string, string][] = [
    ["Rede", r.rede || "-"],
    ["Loja", r.loja || "-"],
    ["SIF", r.sif || "-"],
    ["Técnico", r.tecnico || "-"],
    ["Produção", formatDate(r.dataProducao) || "-"],
    ["Rendimento", formatDate(r.data) || "-"],
    ["Corte", r.corteBovino || "-"],
    ["Marca", r.marca || "-"],
  ];
  doc.setFontSize(11);
  info.forEach(([label, value], i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = M + col * (CONTENT / 2);
    const ly = y + row * 8;
    doc.setFont("helvetica", "bold");
    doc.text(`${label}:`, x, ly);
    doc.setFont("helvetica", "normal");
    doc.text(doc.splitTextToSize(value, CONTENT / 2 - 28) as string[], x + 25, ly);
  });
  y += 8 * Math.ceil(info.length / 2) + 4;

  doc.setDrawColor(210, 210, 210);
  doc.line(M, y, W - M, y);
  y += 9;

  const renderMedicao = (m: Medicao, data: string) => {
    const c = calcular({ ...m, data });

    // Pesos e fotos
    const pesos: [string, string, string | null][] = [
      ["Peça Fechada (pesar com tara)", `${num(m.pesoFechado).toFixed(3).replace(".", ",")} kg`, m.fotoFechado],
      ["Produto Inatura (produto sem a embalagem)", `${num(m.pesoInatura).toFixed(3).replace(".", ",")} kg`, m.fotoInatura],
      ["Sebo", `${num(m.pesoSebo).toFixed(3).replace(".", ",")} kg`, m.fotoSebo],
    ];
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    ensure(12);
    doc.text("Pesos", M, y);
    y += 6;
    doc.setFontSize(10);
    pesos.forEach(([label, value]) => {
      ensure(7);
      doc.setFont("helvetica", "normal");
      doc.text(label, M, y);
      doc.setFont("helvetica", "bold");
      doc.text(value, W - M, y, { align: "right" });
      y += 6;
    });
    y += 3;

    const fotos = pesos.filter(([, , src]) => !!src) as [string, string, string][];
    if (fotos.length) {
      const gap = 3;
      const maxRowH = 28;
      const imgW = (CONTENT - gap * (fotos.length - 1)) / fotos.length;
      const heights = fotos.map(([, , src]) => {
        const props = doc.getImageProperties(src);
        return Math.min(maxRowH, (props.height / props.width) * imgW);
      });
      const rowH = Math.max(...heights);
      ensure(rowH + 6);
      fotos.forEach(([label, , src], i) => {
        doc.addImage(src, "JPEG", M + i * (imgW + gap), y, imgW, heights[i] ?? rowH);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(110, 110, 110);
        doc.text(label, M + i * (imgW + gap), y + rowH + 3);
      });
      doc.setTextColor(20, 20, 20);
      y += rowH + 6;
    }

    // Resultados
    const cards: [string, string, [number, number, number]][] = [
      ["Tempo de Produção", c.dias === null ? "Informe as datas" : `${c.dias} dia(s)`, [14, 130, 190]],
      ["Exsudação", `${kg(c.exsudacao)}  (${pct(c.percExsudacao)})`, [40, 90, 200]],
      ["Rendimento", pct(c.rendimento), [22, 138, 90]],
      ["Sebo retirado dos cortes", kg(c.seboCortes), [220, 120, 30]],
      ["Perda total", `${pct(c.perdaPerc)}  (${kg(c.perdaKg)})`, [190, 138, 20]],
    ];
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    ensure(12);
    doc.text("Resultados", M, y);
    y += 7;
    cards.forEach(([label, value, rgb]) => {
      ensure(12);
      doc.setFillColor(243, 246, 248);
      doc.rect(M, y - 5, CONTENT, 10, "F");
      doc.setFillColor(...rgb);
      doc.rect(M, y - 5, 2, 10, "F");
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(20, 20, 20);
      doc.text(label, M + 5, y + 1.5);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...rgb);
      doc.text(value, W - M - 2, y + 1.5, { align: "right" });
      doc.setTextColor(20, 20, 20);
      y += 12;
    });
    y += 2;

    // Cortes
    const cortes = m.cortes.filter((x) => x.nome || num(x.peso) || num(x.sebo));
    if (cortes.length) {
      ensure(16);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.text("Cortes separados", M, y);
      y += 7;
      doc.setFontSize(10);
      doc.text("Produto", M, y);
      doc.text("Peso", M + CONTENT * 0.6, y, { align: "right" });
      doc.text("Sebo", W - M, y, { align: "right" });
      y += 2;
      doc.setDrawColor(220, 220, 220);
      doc.line(M, y, W - M, y);
      y += 5;
      doc.setFont("helvetica", "normal");
      cortes.forEach((corte) => {
        ensure(7);
        doc.text(corte.nome || "—", M, y);
        doc.text(kg(num(corte.peso)), M + CONTENT * 0.6, y, { align: "right" });
        doc.text(kg(num(corte.sebo)), W - M, y, { align: "right" });
        y += 6;
      });
      y += 1;
      doc.setFont("helvetica", "bold");
      ensure(20);
      doc.text(`Soma peso: ${kg(c.somaCortes)}`, M, y);
      y += 6;
      doc.text(`Soma sebo: ${kg(c.seboCortes)}`, M, y);
      y += 6;
      doc.setFont("helvetica", "normal");
      doc.text(`Diferença (inatura - soma): ${kg(c.diferencaCortes)}`, M, y);
      y += 6;
    }
  };

  renderMedicao(r, r.data);

  (r.extras ?? []).forEach((extra, i) => {
    ensure(40);
    y += 4;
    doc.setDrawColor(210, 210, 210);
    doc.line(M, y, W - M, y);
    y += 9;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text(`${i + 2}º Rendimento`, M, y);
    y += 7;
    doc.setFontSize(11);
    const extraInfo: [string, string][] = [
      ["SIF", extra.sif || "-"],
      ["Produção", formatDate(extra.dataProducao) || "-"],
      ["Corte", extra.corteBovino || "-"],
      ["Marca", extra.marca || "-"],
    ];
    extraInfo.forEach(([label, value], idx) => {
      const col = idx % 2;
      const row = Math.floor(idx / 2);
      const x = M + col * (CONTENT / 2);
      const ly = y + row * 8;
      doc.setFont("helvetica", "bold");
      doc.text(`${label}:`, x, ly);
      doc.setFont("helvetica", "normal");
      doc.text(doc.splitTextToSize(value, CONTENT / 2 - 28) as string[], x + 25, ly);
    });
    y += 8 * Math.ceil(extraInfo.length / 2) + 4;
    renderMedicao(extra, r.data);
  });


  const pages = doc.getNumberOfPages();
  for (let p = 1; p <= pages; p++) {
    doc.setPage(p);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(130, 130, 130);
    doc.text(`${r.loja || "Loja"} — ${formatDate(r.data)}`, M, H - 8);
    doc.text(`Página ${p} de ${pages}`, W - M, H - 8, { align: "right" });
  }

  return doc;
}

export function rendimentoFileName(r: Rendimento) {
  return `rendimento-${slug(r.loja)}-${r.data}.pdf`;
}

export async function downloadRendimentoPdf(r: Rendimento) {
  const doc = await buildRendimentoPdf(r);
  doc.save(rendimentoFileName(r));
}

export async function shareRendimentoPdf(r: Rendimento) {
  const doc = await buildRendimentoPdf(r);
  const blob = doc.output("blob");
  const file = new File([blob], rendimentoFileName(r), { type: "application/pdf" });
  const nav = navigator as Navigator & { canShare?: (data: { files: File[] }) => boolean };
  if (nav.share && nav.canShare?.({ files: [file] })) {
    await nav.share({ files: [file], title: rendimentoFileName(r) });
    return true;
  }
  doc.save(rendimentoFileName(r));
  return false;
}
