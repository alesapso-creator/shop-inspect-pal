export type StatusId = "conforme" | "parcial" | "nao_conforme";

export const STATUS: { id: StatusId; label: string; tone: string }[] = [
  { id: "conforme", label: "Conforme", tone: "ok" },
  { id: "parcial", label: "Parcialmente conforme", tone: "warn" },
  { id: "nao_conforme", label: "Não conforme", tone: "bad" },
];

export const AREAS = [
  { id: "balcao_atendimento", label: "Balcão de Atendimento", icon: "ConciergeBell" },
  { id: "balcao_autosservico", label: "Balcão de Autosserviço", icon: "ShoppingBasket" },
  { id: "camara_fria", label: "Câmara Fria", icon: "Snowflake" },
  { id: "area_manipulacao", label: "Área de Manipulação", icon: "ChefHat" },
] as const;

export type AreaId = (typeof AREAS)[number]["id"];

export type AreaEntry = {
  status: StatusId | null;
  problemas: string;
  oportunidades: string;
  fotos: string[]; // JPEG data URLs
};

export type Inspection = {
  id: string;
  rede: string;
  loja: string;
  data: string; // yyyy-mm-dd
  tecnico: string;
  createdAt: number;
  updatedAt: number;
  areas: Partial<Record<AreaId, AreaEntry>>;
};

export const emptyArea = (): AreaEntry => ({
  status: null,
  problemas: "",
  oportunidades: "",
  fotos: [],
});

export function newInspection(): Inspection {
  const now = Date.now();
  return {
    id: crypto.randomUUID(),
    rede: "",
    loja: "",
    data: new Date().toISOString().slice(0, 10),
    tecnico: "",
    createdAt: now,
    updatedAt: now,
    areas: {},
  };
}

export function areaLabel(id: string) {
  return AREAS.find((a) => a.id === id)?.label ?? id;
}

export function statusLabel(id: StatusId | null | undefined) {
  return STATUS.find((s) => s.id === id)?.label ?? "Não preenchido";
}

export function formatDate(iso: string) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}
