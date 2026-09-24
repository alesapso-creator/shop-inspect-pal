import { z } from "zod";
import type { NivelId } from "./inspection";

export const DESTAQUES_ATENDIMENTO = [
  "Gancheira",
  "Bandeja",
  "Atendimento",
  "Higienização",
  "Outros",
] as const;

export const DESTAQUES_AUTOSSERVICO = [
  "Cortes",
  "Padronização",
  "Melhor aproveitamento das peças",
  "Organização",
  "Exposição dos produtos",
  "Outros",
] as const;

export const DESTAQUES_CAMARA_FRIA = [
  "Higienização",
  "Organização",
  "Conferência PVPS",
  "Identificação de Data",
  "Outros",
] as const;

export const COMENTARIOS_SUGERIDOS = [
  "Demonstra excelência técnica, cuidado com os produtos e compromisso com o cliente.",
  "É referência para a equipe pela organização, qualidade do trabalho e atenção aos detalhes.",
  "Seu trabalho contribui para uma apresentação impecável e para o melhor aproveitamento dos produtos.",
] as const;

export type AcougueiroValor = {
  id: string;
  rede: string;
  loja: string;
  colaborador: string;
  nivel: NivelId | null;
  data: string;
  tecnico: string;
  fotoPerfil: string | null;
  destaquesAtendimento: string[];
  outrosAtendimento: string;
  habilidadeAtendimento: string;
  destaquesAutosservico: string[];
  outrosAutosservico: string;
  habilidadeAutosservico: string;
  destaquesCamaraFria: string[];
  outrosCamaraFria: string;
  habilidadeCamaraFria: string;
  comentario: string;
  fotosTrabalho: string[];
  createdAt: number;
  updatedAt: number;
};

export const acougueiroValorSchema = z.object({
  rede: z.string().trim().min(1, "Informe a rede.").max(100),
  loja: z.string().trim().min(1, "Informe a loja.").max(100),
  colaborador: z.string().trim().min(1, "Informe o nome do colaborador.").max(120),
  nivel: z.enum(["iniciante", "bronze", "prata", "ouro"], {
    required_error: "Escolha o nível do colaborador.",
  }),
  data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Informe a data."),
  tecnico: z.string().trim().min(1, "Informe o técnico.").max(120),
  fotoPerfil: z.string().min(1, "Adicione a foto de perfil do colaborador."),
  destaques: z.array(z.string()).min(1, "Selecione ou escreva pelo menos um destaque."),
  habilidadeAtendimento: z.string().trim().max(200, "A habilidade do Balcão de Atendimento deve ter até 200 caracteres."),
  outrosAtendimento: z.string().trim().max(80, "O campo Outros do Balcão de Atendimento deve ter até 80 caracteres."),
  habilidadeAutosservico: z.string().trim().max(200, "A habilidade do Balcão de Autosserviço deve ter até 200 caracteres."),
  outrosAutosservico: z.string().trim().max(80, "O campo Outros do Balcão de Autosserviço deve ter até 80 caracteres."),
  habilidadeCamaraFria: z.string().trim().max(200, "A habilidade da Câmara fria deve ter até 200 caracteres."),
  outrosCamaraFria: z.string().trim().max(80, "O campo Outros da Câmara fria deve ter até 80 caracteres."),
  comentario: z.string().trim().min(1, "Adicione um comentário de reconhecimento.").max(1200),
});

export function newAcougueiroValor(): AcougueiroValor {
  const now = Date.now();
  return {
    id: crypto.randomUUID(),
    rede: "",
    loja: "",
    colaborador: "",
    nivel: null,
    data: new Date().toISOString().slice(0, 10),
    tecnico: "",
    fotoPerfil: null,
    destaquesAtendimento: [],
    outrosAtendimento: "",
    habilidadeAtendimento: "",
    destaquesAutosservico: [],
    outrosAutosservico: "",
    habilidadeAutosservico: "",
    destaquesCamaraFria: [],
    outrosCamaraFria: "",
    habilidadeCamaraFria: "",
    comentario: "",
    fotosTrabalho: [],
    createdAt: now,
    updatedAt: now,
  };
}

export function formatValorDate(iso: string) {
  if (!iso) return "";
  const [year, month, day] = iso.split("-");
  return `${day}/${month}/${year}`;
}