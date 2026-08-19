import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import {
  AlertTriangle,
  Check,
  ChefHat,
  CircleDashed,
  ConciergeBell,
  FileDown,
  GraduationCap,
  Share2,
  ShoppingBasket,
  Snowflake,
  X,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AREAS,
  isTrainingArea,
  statusLabel,
  type Inspection,
  type StatusId,
} from "@/lib/inspection";
import { getInspection, saveInspection } from "@/lib/inspection-store";
import { downloadInspectionPdf, shareInspectionPdf } from "@/lib/pdf";


export const Route = createFileRoute("/inspecao/$id")({
  head: () => ({
    meta: [
      { title: "Nova inspeção — Inspeção de Loja" },
      {
        name: "description",
        content: "Preencha rede, loja, data e técnico e escolha a área que deseja inspecionar.",
      },
      { property: "og:title", content: "Nova inspeção — Inspeção de Loja" },
      {
        property: "og:description",
        content: "Preencha os dados da loja e inspecione cada área com fotos e observações.",
      },
    ],
  }),
  component: InspecaoDetalhe,
});

const AREA_ICONS: Record<string, LucideIcon> = {
  ConciergeBell,
  ShoppingBasket,
  Snowflake,
  ChefHat,
};

const STATUS_ICON: Record<StatusId, LucideIcon> = {
  conforme: Check,
  parcial: AlertTriangle,
  nao_conforme: X,
};

const STATUS_CLASS: Record<StatusId, string> = {
  conforme: "bg-ok/15 text-ok",
  parcial: "bg-warn/15 text-warn",
  nao_conforme: "bg-bad/15 text-bad",
};

function InspecaoDetalhe() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const [inspecao, setInspecao] = useState<Inspection | null>(null);

  const load = useCallback(async () => {
    const found = await getInspection(id);
    if (!found) {
      void navigate({ to: "/" });
      return;
    }
    setInspecao(found);
  }, [id, navigate]);

  useEffect(() => {
    void load();
  }, [load]);

  const update = (patch: Partial<Inspection>) => {
    setInspecao((prev) => {
      if (!prev) return prev;
      const next = { ...prev, ...patch };
      void saveInspection(next);
      return next;
    });
  };

  const gerarPdf = async () => {
    if (!inspecao) return;
    const preenchidas = AREAS.filter((a) => inspecao.areas[a.id]);
    if (preenchidas.length === 0) {
      toast.error("Preencha ao menos uma área antes de gerar o PDF.");
      return;
    }
    await downloadInspectionPdf(inspecao);
    toast.success("PDF gerado com sucesso.");
  };

  if (!inspecao) {
    return (
      <AppShell title="Inspeção" backTo={{ to: "/" }}>
        <p className="py-10 text-center text-sm text-muted-foreground">Carregando…</p>
      </AppShell>
    );
  }

  return (
    <AppShell
      title={inspecao.loja || "Nova inspeção"}
      subtitle={inspecao.rede || "Preencha os dados da loja"}
      backTo={{ to: "/" }}
    >
      <section className="rounded-2xl border border-border bg-card p-4 shadow-sm">
        <div className="grid gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="rede">Rede</Label>
            <Input
              id="rede"
              value={inspecao.rede}
              placeholder="Nome da rede"
              onChange={(e) => update({ rede: e.target.value })}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="loja">Loja</Label>
            <Input
              id="loja"
              value={inspecao.loja}
              placeholder="Nome ou número da loja"
              onChange={(e) => update({ loja: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="data">Data</Label>
              <Input
                id="data"
                type="date"
                value={inspecao.data}
                onChange={(e) => update({ data: e.target.value })}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="tecnico">Técnico</Label>
              <Input
                id="tecnico"
                value={inspecao.tecnico}
                placeholder="Seu nome"
                onChange={(e) => update({ tecnico: e.target.value })}
              />
            </div>
          </div>
        </div>
      </section>

      <h2 className="mb-3 mt-7 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        Áreas para inspecionar
      </h2>
      <div className="grid grid-cols-2 gap-3">
        {AREAS.map((area) => {
          const Icon = AREA_ICONS[area.icon] ?? CircleDashed;
          const entry = inspecao.areas[area.id];
          const treinamento = isTrainingArea(area.id);
          const status = entry?.status ?? null;
          const StatusIcon = treinamento
            ? entry
              ? Check
              : CircleDashed
            : status
              ? STATUS_ICON[status]
              : CircleDashed;
          const badgeClass = treinamento
            ? entry
              ? "bg-ok/15 text-ok"
              : "bg-muted text-muted-foreground"
            : status
              ? STATUS_CLASS[status]
              : "bg-muted text-muted-foreground";
          const badgeLabel = treinamento
            ? entry
              ? "Registrado"
              : "Não preenchido"
            : status
              ? statusLabel(status)
              : "Não preenchido";
          return (
            <Link
              key={area.id}
              to="/area/$id/$areaId"
              params={{ id: inspecao.id, areaId: area.id }}
              className="flex flex-col justify-between rounded-2xl border border-border bg-card p-4 shadow-sm transition-colors active:bg-accent"
            >
              <Icon className="size-8 text-primary" />
              <p className="mt-3 text-sm font-semibold leading-snug text-card-foreground">
                {area.label}
              </p>
              <span
                className={`mt-2 inline-flex w-fit items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${badgeClass}`}
              >
                <StatusIcon className="size-3" />
                {badgeLabel}
              </span>
            </Link>
          );
        })}
      </div>

      <div className="fixed inset-x-0 bottom-0 space-y-2 border-t border-border bg-background/95 p-4 backdrop-blur">
        <div className="mx-auto max-w-3xl space-y-2">
          <Button size="lg" className="h-13 w-full text-base" onClick={gerarPdf}>
            <FileDown className="size-5" /> Finalizar e gerar PDF
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="h-13 w-full text-base"
            onClick={compartilharWhatsApp}
          >
            <Share2 className="size-5" /> Compartilhar no WhatsApp
          </Button>
        </div>
      </div>

    </AppShell>
  );
}
