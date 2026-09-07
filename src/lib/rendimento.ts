export type Corte = {
  id: string;
  nome: string;
  peso: string;
  sebo: string;
};

export type Medicao = {
  id: string;
  sif: string;
  dataProducao: string;
  corteBovino: string;
  marca: string;
  pesoFechado: string;
  pesoInatura: string;
  pesoSebo: string;
  fotoFechado: string | null;
  fotoInatura: string | null;
  fotoSebo: string | null;
  cortes: Corte[];
};

export type Rendimento = {
  id: string;
  rede: string;
  loja: string;
  sif: string;
  tecnico: string;
  corteBovino: string;
  marca: string;
  dataProducao: string; // yyyy-mm-dd
  data: string; // yyyy-mm-dd (data do rendimento)
  pesoFechado: string;
  pesoInatura: string;
  pesoSebo: string;
  fotoFechado: string | null;
  fotoInatura: string | null;
  fotoSebo: string | null;
  cortes: Corte[];
  extras?: Medicao[];
  createdAt: number;
  updatedAt: number;
};

export function newMedicao(): Medicao {
  return {
    id: crypto.randomUUID(),
    sif: "",
    dataProducao: "",
    corteBovino: "",
    marca: "",
    pesoFechado: "",
    pesoInatura: "",
    pesoSebo: "",
    fotoFechado: null,
    fotoInatura: null,
    fotoSebo: null,
    cortes: [],
  };
}

export function newRendimento(): Rendimento {
  const now = Date.now();
  return {
    id: crypto.randomUUID(),
    rede: "",
    loja: "",
    sif: "",
    tecnico: "",
    corteBovino: "",
    marca: "",
    dataProducao: "",
    data: new Date().toISOString().slice(0, 10),
    pesoFechado: "",
    pesoInatura: "",
    pesoSebo: "",
    fotoFechado: null,
    fotoInatura: null,
    fotoSebo: null,
    cortes: [],
    extras: [],
    createdAt: now,
    updatedAt: now,
  };
}

export const num = (value: string) => {
  const n = parseFloat(String(value).replace(",", "."));
  return Number.isFinite(n) ? n : 0;
};


export const kg = (value: number) => `${value.toFixed(3).replace(".", ",")} kg`;
export const pct = (value: number) => `${value.toFixed(2).replace(".", ",")} %`;

export function formatDate(iso: string) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

export type Calculo = {
  fechado: number;
  inatura: number;
  sebo: number;
  seboCortes: number;
  somaCortes: number;
  diferencaCortes: number;
  exsudacao: number;
  percExsudacao: number;
  rendimento: number;
  perdaKg: number;
  perdaPerc: number;
  dias: number | null;
};

export function calcular(r: Rendimento): Calculo {
  const fechado = num(r.pesoFechado);
  const inatura = num(r.pesoInatura);
  const sebo = num(r.pesoSebo);
  const seboCortes = r.cortes.reduce((s, c) => s + num(c.sebo), 0);
  const somaCortes = r.cortes.reduce((s, c) => s + num(c.peso), 0);
  const exsudacao = fechado - inatura;
  const perdaKg = exsudacao + sebo + seboCortes;

  let dias: number | null = null;
  if (r.dataProducao && r.data) {
    const diff = new Date(r.data).getTime() - new Date(r.dataProducao).getTime();
    dias = Math.max(0, Math.round(diff / 86400000));
  }

  return {
    fechado,
    inatura,
    sebo,
    seboCortes,
    somaCortes,
    diferencaCortes: inatura - somaCortes,
    exsudacao,
    percExsudacao: fechado > 0 ? (exsudacao / fechado) * 100 : 0,
    rendimento: fechado > 0 ? (inatura / fechado) * 100 : 0,
    perdaKg,
    perdaPerc: fechado > 0 ? (perdaKg / fechado) * 100 : 0,
    dias,
  };
}
